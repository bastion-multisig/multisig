import { MultisigInstruction } from "./../lib/TxInterpreter/src/multisigInstruction";
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
  findSmartWallet,
  findSubaccountInfoAddress,
  findWalletDerivedAddress,
  GOKI_ADDRESSES,
  TxInterpreter,
} from "../lib/TxInterpreter/src";
import {
  IDL as SmartWalletIDL,
  SmartWallet,
} from "../lib/TxInterpreter/src/idl/smart_wallet";
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getRandomPartialSigner } from "../lib/TxInterpreter/src";
import { MINT_SIZE } from "@solana/spl-token";
import { SmartWalletData } from "../lib/TxInterpreter/lib";

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
  let smartWalletInfo: SmartWalletData;
  const treasuryWalletIndex = 0;
  let treasury: PublicKey;

  it("Set owners", async () => {
    program = new Program(SmartWalletIDL, GOKI_ADDRESSES.SmartWallet, provider);

    [smartWallet, smartWalletBump] = findSmartWallet(smartWalletBase.publicKey);
    [treasury] = findWalletDerivedAddress(smartWallet, treasuryWalletIndex);

    let [subaccountInfo, subaccountInfoBump] =
      findSubaccountInfoAddress(treasury);

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

    smartWalletInfo = await program.account.smartWallet.fetch(smartWallet);

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
  let withdrawSolTransaction: PublicKey;
  it("Propose withdraw sol from treasury", async () => {
    const withdrawSolIx = SystemProgram.transfer({
      fromPubkey: treasury,
      toPubkey: receiver.publicKey,
      lamports: 10 * LAMPORTS_PER_SOL,
    });
    // Propose that the multisig pays sol
    const { address, builder } = createTransaction(
      program,
      smartWallet,
      smartWalletInfo,
      [{ ...withdrawSolIx, partialSigners: [] }]
    );

    await builder.rpc();
    withdrawSolTransaction = address;
  });

  it("Execute sol withdrawal from treasury", async () => {
    await executeTransaction(
      program,
      withdrawSolTransaction,
      treasuryWalletIndex
    );

    const treasuryInfo = await connection.getAccountInfo(treasury);

    assert.equal(treasuryInfo.lamports, 40 * LAMPORTS_PER_SOL);
  });

  let intepretedWithdrawSolTxPubkeys: PublicKey[];
  it("Interpret withdrawing sol from treasury", async () => {
    const withdrawSolIx = SystemProgram.transfer({
      fromPubkey: treasury,
      toPubkey: receiver.publicKey,
      lamports: 10 * LAMPORTS_PER_SOL,
    });
    const transaction = new Transaction().add(withdrawSolIx);
    const { interpreted, txPubkeys } = await TxInterpreter.multisig(
      program,
      smartWallet,
      transaction
    );

    intepretedWithdrawSolTxPubkeys = txPubkeys;

    const signedByWallet = await wallet.signAllTransactions(interpreted);

    await provider.sendAll(
      signedByWallet.map((tx) => {
        return { tx };
      })
    );
  });

  it("Execute interpreted sol withdrawal from treasury", async () => {
    for (const txPubkey of intepretedWithdrawSolTxPubkeys) {
      await executeTransaction(program, txPubkey, treasuryWalletIndex);
    }

    const treasuryInfo = await connection.getAccountInfo(treasury);

    assert.equal(treasuryInfo.lamports, 30 * LAMPORTS_PER_SOL);
  });

  let createMintTransaction: PublicKey;
  let mint: PublicKey;
  it("Propose create mint", async () => {
    const mintPartialSigner = getRandomPartialSigner(smartWallet);
    mint = mintPartialSigner.pubkey;

    const instructions: MultisigInstruction[] = [
      {
        ...SystemProgram.createAccount({
          fromPubkey: treasury,
          newAccountPubkey: mintPartialSigner.pubkey,
          lamports: await getMinimumBalanceForRentExemptMint(connection),
          space: MINT_SIZE,
          programId: TOKEN_PROGRAM_ID,
        }),
        partialSigners: [mintPartialSigner],
      },
      {
        ...createInitializeMintInstruction(
          mintPartialSigner.pubkey,
          9,
          treasury,
          treasury
        ),
        partialSigners: [],
      },
    ];

    let { address, builder } = createTransaction(
      program,
      smartWallet,
      smartWalletInfo,
      instructions
    );
    await builder.rpc();
    createMintTransaction = address;
  });

  it("Execute create mint", async () => {
    await executeTransaction(
      program,
      createMintTransaction,
      treasuryWalletIndex
    );
  });

  let interpretCreateMintTransactions: PublicKey[];
  it("Interpret create mint", async () => {
    const mint = Keypair.generate();

    const instructions: TransactionInstruction[] = [
      SystemProgram.createAccount({
        fromPubkey: treasury,
        newAccountPubkey: mint.publicKey,
        lamports: await getMinimumBalanceForRentExemptMint(connection),
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(mint.publicKey, 9, treasury, treasury),
    ];
    const transaction = new Transaction().add(...instructions);
    transaction.partialSign(mint);

    const { interpreted, txPubkeys } = await TxInterpreter.multisig(
      program,
      smartWallet,
      transaction
    );
    interpretCreateMintTransactions = txPubkeys;

    wallet.signAllTransactions(interpreted);

    await provider.sendAll(
      interpreted.map((tx) => {
        return { tx };
      })
    );
  });

  it("Execute interpreted create mint", async () => {
    for (const txPubkey of interpretCreateMintTransactions) {
      await executeTransaction(program, txPubkey, treasuryWalletIndex);
    }
  });

  it("Interpret create associated token account", async () => {
    const ataPk = await getAssociatedTokenAddress(mint, treasury, true);
    const ataInstruction = createAssociatedTokenAccountInstruction(
      treasury,
      ataPk,
      treasury,
      mint
    );

    const transaction = new Transaction().add(ataInstruction);

    const { interpreted, txPubkeys } = await TxInterpreter.multisig(
      program,
      smartWallet,
      transaction
    );
    wallet.signAllTransactions(interpreted);

    await provider.sendAll(
      interpreted.map((tx) => {
        return { tx };
      })
    );

    for (const txPubkey of txPubkeys) {
      await executeTransaction(program, txPubkey, treasuryWalletIndex);
    }
  });
});
