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
  createTransaction,
  executeTransaction,
  TxInterpreter,
} from "../lib/TxInterpreter/src";
import { IDL as SmartWalletIDL, SmartWallet } from "../deps/smart_wallet";
import {
  findTransactionAddress,
  findSmartWallet,
  findWalletDerivedAddress,
  findSubaccountInfoAddress,
  GOKI_ADDRESSES,
} from "@gokiprotocol/client";

describe("multisig", () => {
  // Configure the client to use the local cluster.
  const { connection, wallet } = AnchorProvider.env();
  const provider = new AnchorProvider(connection, wallet, {
    ...AnchorProvider.defaultOptions(),
    skipPreflight: true,
  });
  setProvider(provider);
  let program: Program<SmartWallet>;

  const ownerB = Keypair.generate();
  const ownerC = Keypair.generate();
  const smartWalletBase = Keypair.generate();
  let smartWallet: PublicKey;
  let smartWalletBump: number;
  const treasuryWalletIndex = 0;
  let treasury: PublicKey;

  it("Set owners", async () => {
    program = new Program(SmartWalletIDL, GOKI_ADDRESSES.SmartWallet, provider);

    [smartWallet, smartWalletBump] = await findSmartWallet(
      smartWalletBase.publicKey
    );
    [treasury] = await findWalletDerivedAddress(
      smartWallet,
      treasuryWalletIndex
    );

    let [subaccountInfo, subaccountInfoBump] = await findSubaccountInfoAddress(
      treasury
    );

    const owners = [wallet.publicKey, ownerB.publicKey, ownerC.publicKey];

    const threshold = new BN(1);
    await program.methods
      .createSmartWallet(
        smartWalletBump,
        owners.length,
        owners,
        threshold,
        new BN(0)
      )
      .accounts({
        base: smartWalletBase.publicKey,
        smartWallet,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .postInstructions([
        await program.methods
          .createSubaccountInfo(
            subaccountInfoBump,
            treasury,
            smartWallet,
            new BN(treasuryWalletIndex),
            { derived: {} }
          )
          .accounts({
            subaccountInfo,
            payer: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .instruction(),
      ])
      .signers([smartWalletBase])
      .rpc();

    let smartWalletInfo = await program.account.smartWallet.fetch(smartWallet);

    assert.ok(smartWalletInfo.threshold.eq(new BN(1)));
    assert.deepStrictEqual(smartWalletInfo.owners, owners);
    assert.ok(smartWalletInfo.ownerSetSeqno === 0);
  });

  it("Deposit sol to smart wallet", async () => {
    const transferParams: TransferParams = {
      fromPubkey: wallet.publicKey,
      toPubkey: treasury,
      lamports: 50 * LAMPORTS_PER_SOL,
    };

    let tx = new Transaction({
      feePayer: wallet.publicKey,
      recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    }).add(SystemProgram.transfer(transferParams));
    tx = await wallet.signTransaction(tx);
    await provider.sendAndConfirm(tx, []);

    const treasuryInfo = await connection.getAccountInfo(treasury);
    assert.equal(treasuryInfo.lamports, 50000000000);
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
    const { transaction, builder } = await createTransaction(
      program,
      smartWallet,
      wallet.publicKey,
      [withdrawSolIx]
    );
    await builder.rpc();
    withdrawSolTransaction = transaction;
  });

  it("Execute sol withdrawal from treasury", async () => {
    await executeTransaction(
      program,
      withdrawSolTransaction,
      ownerB,
      treasuryWalletIndex
    );

    const treasuryInfo = await connection.getAccountInfo(treasury);

    assert.equal(treasuryInfo.lamports, 40 * LAMPORTS_PER_SOL);
  });

  it("Interpret withdrawing sol from treasury", async () => {
    const transaction = new Transaction({
      recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
      feePayer: wallet.publicKey,
    }).add(withdrawSolIx);
    const { interpreted, txPubkeys } = await TxInterpreter.multisig(
      program,
      smartWallet,
      wallet.publicKey,
      transaction
    );

    const signedByWallet = await wallet.signAllTransactions(interpreted);
    await provider.sendAll(
      signedByWallet.map((tx) => {
        return { tx };
      })
    );

    for (const txPubkey of txPubkeys) {
      await executeTransaction(program, txPubkey, ownerB, treasuryWalletIndex);
    }

    const treasuryInfo = await connection.getAccountInfo(treasury);

    assert.equal(treasuryInfo.lamports, 30 * LAMPORTS_PER_SOL);
  });

  // let createMintTransactions: PublicKey[];
  // it("Propose create mint", async () => {
  //   // Options:
  //   // - make mint a PDA
  //   // - Make mint a new random keypair (somehow)
  //   let mint = Keypair.generate();

  //   createMintTransactions = [
  //     await createTransaction(
  //       program,
  //       smartWallet.publicKey,
  //       ownerA,
  //       SystemProgram.createAccount({
  //         fromPubkey: treasury,
  //         newAccountPubkey: mint.publicKey,
  //         lamports: await token.getMinimumBalanceForRentExemptMint(connection),
  //         space: token.MINT_SIZE,
  //         programId: SystemProgram.programId,
  //       })
  //     ),
  //     await createTransaction(
  //       program,
  //       smartWallet.publicKey,
  //       ownerA,
  //       token.createInitializeMintInstruction(
  //         mint.publicKey,
  //         9,
  //         treasury,
  //         treasury
  //       )
  //     ),
  //   ];
  // });

  // it("Execute create mint", async () => {
  //   for (const txPubkey of createMintTransactions) {
  //     await approveAndExecute(
  //       program,
  //       smartWallet.publicKey,
  //       treasury,
  //       ownerB,
  //       txPubkey
  //     );
  //   }
  // });

  // let mint = Keypair.generate();
  // let interpretCreateMintTransactions: PublicKey[];
  // it("Interpret create mint", async () => {
  //   const createIx = SystemProgram.createAccount({
  //     fromPubkey: treasury,
  //     newAccountPubkey: mint.publicKey,
  //     lamports: await token.getMinimumBalanceForRentExemptMint(connection),
  //     space: token.MINT_SIZE,
  //     programId: SystemProgram.programId,
  //   });
  //   const initIx = token.createInitializeMintInstruction(
  //     mint.publicKey,
  //     9,
  //     treasury,
  //     treasury
  //   );
  //   const transaction = new Transaction({ feePayer: treasury }).add(
  //     createIx,
  //     initIx
  //   );
  //   const { interpreted, txPubkeys } = await TxInterpreter.multisig(
  //     program,
  //     smartWallet.publicKey,
  //     ownerA.publicKey,
  //     transaction
  //   );
  //   interpreted.forEach((tx) => {
  //     console.log(ownerA.publicKey.toBase58(), wallet.publicKey.toBase58());
  //     tx.tx.feePayer = ownerA.publicKey;
  //     tx.tx.partialSign(ownerA);
  //     wallet.signTransaction(tx.tx);
  //   });
  //   await provider.sendAll(interpreted);
  //   interpretCreateMintTransactions = txPubkeys;
  // });

  // it("Approve create mint", async () => {
  //   for (const txPubkey of interpretCreateMintTransactions) {
  //     await approveAndExecute(
  //       program,
  //       smartWallet.publicKey,
  //       treasury,
  //       ownerB,
  //       txPubkey
  //     );
  //   }
  //   const treasuryInfo = await connection.getAccountInfo(treasury);

  //   assert.equal(treasuryInfo.lamports, 30 * LAMPORTS_PER_SOL);
  // });

  // it("Interpret create associated token account", async () => {
  //   const ataPk = await token.getAssociatedTokenAddress(
  //     mint.publicKey,
  //     treasury,
  //     true
  //   );
  //   const ataInstruction = token.createAssociatedTokenAccountInstruction(
  //     treasury,
  //     ataPk,
  //     treasury,
  //     mint.publicKey
  //   );

  //   const transaction = new Transaction({
  //     feePayer: wallet.publicKey,
  //   }).add(ataInstruction);

  //   const { interpreted, txPubkeys } = await TxInterpreter.multisig(
  //     program,
  //     smartWallet.publicKey,
  //     ownerA.publicKey,
  //     transaction
  //   );

  //   interpreted.forEach((tx) => {
  //     tx.tx.partialSign(ownerA);
  //     wallet.signTransaction(tx.tx);
  //   });
  //   await provider.sendAll(interpreted);

  //   for (const txPubkey of txPubkeys) {
  //     await approveAndExecute(
  //       program,
  //       smartWallet.publicKey,
  //       treasury,
  //       ownerB,
  //       txPubkey
  //     );
  //   }
  //   const ataInfo = await connection.getAccountInfo(ataPk);
  //   assert.notEqual(ataInfo, undefined);
  // });
});
