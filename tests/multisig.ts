import * as token from "@solana/spl-token";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransferParams,
} from "@solana/web3.js";
import {
  AnchorProvider,
  BN,
  Program,
  setProvider,
} from "@project-serum/anchor";
import assert from "assert";
import {
  approveAndExecute,
  createTransaction,
  multisigSize,
  TxInterpreter,
} from "../lib/TxInterpreter/src";
import { SmartWalletIDL } from "../deps/smart_wallet";

describe("multisig", () => {
  // Configure the client to use the local cluster.
  const { connection, wallet } = AnchorProvider.env();
  const provider = new AnchorProvider(connection, wallet, {
    ...AnchorProvider.defaultOptions(),
    skipPreflight: true,
  });
  setProvider(provider);
  let program: Program<SmartWalletIDL>;

  const ownerA = Keypair.generate();
  const ownerB = Keypair.generate();
  const ownerC = Keypair.generate();
  const ownerD = Keypair.generate();
  const multisig = Keypair.generate();
  let treasury: PublicKey;

  it("Set owners", async () => {
    program = await Program.at<SmartWalletIDL>(
      "G9UbnEqjXnyssCXZBTTbq9spAaW8aekvveTgnxfBBK5M",
      provider
    );
    [treasury] = await PublicKey.findProgramAddress(
      [multisig.publicKey.toBytes()],
      program.programId
    );
    await connection.requestAirdrop(ownerA.publicKey, 50 * LAMPORTS_PER_SOL);

    const owners = [ownerA.publicKey, ownerB.publicKey, ownerC.publicKey];

    const threshold = new BN(2);
    await program.methods
      .createMultisig(owners, threshold)
      .accounts({
        multisig: multisig.publicKey,
        treasury,
      })
      .signers([multisig])
      .preInstructions([
        await program.account.multisig.createInstruction(
          multisig,
          multisigSize(3)
        ),
      ])
      .rpc();

    let multisigAccount = await program.account.multisig.fetch(
      multisig.publicKey
    );

    assert.ok(multisigAccount.threshold.eq(new BN(2)));
    assert.deepStrictEqual(multisigAccount.owners, owners);
    assert.ok(multisigAccount.ownerSetSeqno === 0);

    const pid = program.programId;
    const keys = [
      {
        pubkey: multisig.publicKey,
        isWritable: true,
        isSigner: false,
      },
      {
        pubkey: treasury,
        isWritable: false,
        isSigner: true,
      },
    ];
    const newOwners = [ownerA.publicKey, ownerB.publicKey, ownerD.publicKey];
    const data = program.coder.instruction.encode("set_owners", {
      owners: newOwners,
    });
    const instruction = new TransactionInstruction({
      keys,
      programId: pid,
      data,
    });

    const transaction = Keypair.generate();
    const txSize = 1000; // Big enough, cuz I'm lazy.
    await program.rpc.createTransaction(instruction, {
      accounts: {
        multisig: multisig.publicKey,
        transaction: transaction.publicKey,
        proposer: ownerA.publicKey,
      },
      instructions: [
        await program.account.transaction.createInstruction(
          transaction,
          txSize
        ),
      ],
      signers: [transaction, ownerA],
    });

    const txAccount = await program.account.transaction.fetch(
      transaction.publicKey
    );

    assert.ok(txAccount.programId.equals(pid));
    assert.deepStrictEqual(txAccount.accounts, keys);
    assert.deepStrictEqual(txAccount.data, data);
    assert.ok(txAccount.multisig.equals(multisig.publicKey));
    assert.deepStrictEqual(txAccount.didExecute, false);
    assert.ok(txAccount.ownerSetSeqno === 0);

    // Other owner approves transactoin.
    await program.rpc.approve({
      accounts: {
        multisig: multisig.publicKey,
        transaction: transaction.publicKey,
        owner: ownerB.publicKey,
      },
      signers: [ownerB],
    });

    // Now that we've reached the threshold, send the transaction.
    await program.rpc.executeTransaction({
      accounts: {
        multisig: multisig.publicKey,
        treasury,
        transaction: transaction.publicKey,
        owner: ownerA.publicKey,
      },
      signers: [ownerA],
      remainingAccounts: (
        program.instruction.setOwners.accounts({
          multisig: multisig.publicKey,
          treasury,
        }) as any
      )
        // Change the signer status on the treasury signer since it's signed by the program, not the client.
        .map((meta) =>
          meta.pubkey.equals(treasury) ? { ...meta, isSigner: false } : meta
        )
        .concat({
          pubkey: program.programId,
          isWritable: false,
          isSigner: false,
        }),
    });

    multisigAccount = await program.account.multisig.fetch(multisig.publicKey);

    assert.ok(multisigAccount.threshold.eq(new BN(2)));
    assert.deepStrictEqual(multisigAccount.owners, newOwners);
    assert.ok(multisigAccount.ownerSetSeqno === 1);
  });

  it("Assert unique owners", async () => {
    const multisig = Keypair.generate();
    const [treasury] = await PublicKey.findProgramAddress(
      [multisig.publicKey.toBytes()],
      program.programId
    );

    const ownerA = Keypair.generate();
    const ownerB = Keypair.generate();
    const owners = [ownerA.publicKey, ownerB.publicKey, ownerA.publicKey];

    const threshold = new BN(2);
    try {
      await program.methods
        .createMultisig(owners, threshold)
        .accounts({
          multisig: multisig.publicKey,
          treasury,
        })
        .signers([multisig])
        .preInstructions([
          await program.account.multisig.createInstruction(
            multisig,
            multisigSize(owners.length)
          ),
        ])
        .rpc();
      assert.fail();
    } catch (err: any) {
      // Error response is different between rpc versions. Handle both
      const errorNumber = err.error?.errorCode?.number ?? err.code;

      assert.equal(errorNumber, 6008);
    }
  });

  it("Deposit sol to treasury", async () => {
    const sender = Keypair.generate();
    await connection.requestAirdrop(sender.publicKey, 50 * LAMPORTS_PER_SOL);
    await timeout(500);

    const senderInfo = await connection.getAccountInfo(sender.publicKey);
    assert.equal(senderInfo.lamports, 50 * LAMPORTS_PER_SOL);

    const transferParams: TransferParams = {
      fromPubkey: sender.publicKey,
      toPubkey: treasury,
      lamports: 50 * LAMPORTS_PER_SOL,
    };
    await provider.sendAndConfirm(
      new Transaction().add(SystemProgram.transfer(transferParams)),
      [sender]
    );
  });

  const receiver = Keypair.generate();
  let withdrawSolIx: TransactionInstruction;
  let withdrawSolTransaction: PublicKey;
  it("Propose withdraw sol from treasury", async () => {
    withdrawSolIx = SystemProgram.transfer({
      fromPubkey: treasury,
      toPubkey: receiver.publicKey,
      lamports: 10 * LAMPORTS_PER_SOL,
    });
    // Propose that the multisig pays sol
    withdrawSolTransaction = await createTransaction(
      program,
      multisig.publicKey,
      ownerA,
      withdrawSolIx
    );
  });

  it("Execute sol withdrawal from treasury", async () => {
    await approveAndExecute(
      program,
      multisig.publicKey,
      treasury,
      ownerB,
      withdrawSolTransaction
    );

    const treasuryInfo = await connection.getAccountInfo(treasury);

    assert.equal(treasuryInfo.lamports, 40 * LAMPORTS_PER_SOL);
  });

  it("Interpret withdrawing sol from treasury", async () => {
    const transaction = new Transaction({
      feePayer: wallet.publicKey,
    }).add(withdrawSolIx);
    const { interpreted, txPubkeys } = await TxInterpreter.multisig(
      program,
      multisig.publicKey,
      ownerA.publicKey,
      transaction
    );

    interpreted.forEach((tx) => {
      tx.tx.partialSign(ownerA);
      wallet.signTransaction(tx.tx);
    });
    await provider.sendAll(interpreted);

    for (const txPubkey of txPubkeys) {
      await approveAndExecute(
        program,
        multisig.publicKey,
        treasury,
        ownerB,
        txPubkey
      );
    }
    const treasuryInfo = await connection.getAccountInfo(treasury);

    assert.equal(treasuryInfo.lamports, 30 * LAMPORTS_PER_SOL);
  });

  let createMintTransactions: PublicKey[];
  it("Propose create mint", async () => {
    // Options:
    // - make mint a PDA
    // - Make mint a new random keypair (somehow)
    let mint = Keypair.generate();

    createMintTransactions = [
      await createTransaction(
        program,
        multisig.publicKey,
        ownerA,
        SystemProgram.createAccount({
          fromPubkey: treasury,
          newAccountPubkey: mint.publicKey,
          lamports: await token.getMinimumBalanceForRentExemptMint(connection),
          space: token.MINT_SIZE,
          programId: SystemProgram.programId,
        })
      ),
      await createTransaction(
        program,
        multisig.publicKey,
        ownerA,
        token.createInitializeMintInstruction(
          mint.publicKey,
          9,
          treasury,
          treasury
        )
      ),
    ];
  });

  it("Execute create mint", async () => {
    for (const txPubkey of createMintTransactions) {
      await approveAndExecute(
        program,
        multisig.publicKey,
        treasury,
        ownerB,
        txPubkey
      );
    }
  });

  let mint = Keypair.generate();
  let interpretCreateMintTransactions: PublicKey[];
  it("Interpret create mint", async () => {
    const createIx = SystemProgram.createAccount({
      fromPubkey: treasury,
      newAccountPubkey: mint.publicKey,
      lamports: await token.getMinimumBalanceForRentExemptMint(connection),
      space: token.MINT_SIZE,
      programId: SystemProgram.programId,
    });
    const initIx = token.createInitializeMintInstruction(
      mint.publicKey,
      9,
      treasury,
      treasury
    );
    const transaction = new Transaction({ feePayer: treasury }).add(
      createIx,
      initIx
    );
    const { interpreted, txPubkeys } = await TxInterpreter.multisig(
      program,
      multisig.publicKey,
      ownerA.publicKey,
      transaction
    );
    interpreted.forEach((tx) => {
      console.log(ownerA.publicKey.toBase58(), wallet.publicKey.toBase58());
      tx.tx.feePayer = ownerA.publicKey;
      tx.tx.partialSign(ownerA);
      wallet.signTransaction(tx.tx);
    });
    await provider.sendAll(interpreted);
    interpretCreateMintTransactions = txPubkeys;
  });

  it("Approve create mint", async () => {
    for (const txPubkey of interpretCreateMintTransactions) {
      await approveAndExecute(
        program,
        multisig.publicKey,
        treasury,
        ownerB,
        txPubkey
      );
    }
    const treasuryInfo = await connection.getAccountInfo(treasury);

    assert.equal(treasuryInfo.lamports, 30 * LAMPORTS_PER_SOL);
  });

  it("Interpret create associated token account", async () => {
    const ataPk = await token.getAssociatedTokenAddress(
      mint.publicKey,
      treasury,
      true
    );
    const ataInstruction = token.createAssociatedTokenAccountInstruction(
      treasury,
      ataPk,
      treasury,
      mint.publicKey
    );

    const transaction = new Transaction({
      feePayer: wallet.publicKey,
    }).add(ataInstruction);

    const { interpreted, txPubkeys } = await TxInterpreter.multisig(
      program,
      multisig.publicKey,
      ownerA.publicKey,
      transaction
    );

    interpreted.forEach((tx) => {
      tx.tx.partialSign(ownerA);
      wallet.signTransaction(tx.tx);
    });
    await provider.sendAll(interpreted);

    for (const txPubkey of txPubkeys) {
      await approveAndExecute(
        program,
        multisig.publicKey,
        treasury,
        ownerB,
        txPubkey
      );
    }
    const ataInfo = await connection.getAccountInfo(ataPk);
    assert.notEqual(ataInfo, undefined);
  });
});

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
