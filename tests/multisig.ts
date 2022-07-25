import { TXInstruction } from "./../lib/TxInterpreter/src/types";
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
  getRandomPartialSigner,
} from "../lib/TxInterpreter/src";
import {
  IDL as SmartWalletIDL,
  SmartWallet,
} from "../lib/TxInterpreter/src/idl/smart_wallet";
import {
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { MINT_SIZE } from "@solana/spl-token";

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
  const walletDerivedIndex = new BN(0);
  let treasury: PublicKey;

  describe("Set owners", () => {
    it("Set owners", async () => {
      program = new Program(
        SmartWalletIDL,
        GOKI_ADDRESSES.SmartWallet,
        provider
      );

      [smartWallet, smartWalletBump] = findSmartWallet(
        smartWalletBase.publicKey
      );
      [treasury] = findWalletDerivedAddress(smartWallet, walletDerivedIndex);

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
              walletDerivedIndex,
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

      const smartWalletInfo = await program.account.smartWallet.fetch(
        smartWallet
      );

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
  });

  const receiver = Keypair.generate();
  describe("Withdraw sol", () => {
    let withdrawSolTransaction: PublicKey;
    it("Propose withdraw sol from treasury", async () => {
      const withdrawSolIx = SystemProgram.transfer({
        fromPubkey: treasury,
        toPubkey: receiver.publicKey,
        lamports: 10 * LAMPORTS_PER_SOL,
      });
      const smartWalletInfo = await program.account.smartWallet.fetch(
        smartWallet
      );
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
      (
        await executeTransaction(
          program,
          withdrawSolTransaction,
          walletDerivedIndex
        )
      ).rpc();

      await sleep(1000);

      const treasuryInfo = await connection.getAccountInfo(treasury);

      assert.equal(treasuryInfo.lamports, 40 * LAMPORTS_PER_SOL);
    });
  });

  describe("Interpret withdraw sol", () => {
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
        [transaction]
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
        await (
          await executeTransaction(program, txPubkey, walletDerivedIndex)
        ).rpc();
      }

      const treasuryInfo = await connection.getAccountInfo(treasury);

      assert.equal(treasuryInfo.lamports, 30 * LAMPORTS_PER_SOL);
    });
  });

  describe("Propose create mint", () => {
    let createMintTransaction: PublicKey;
    it("Propose create mint", async () => {
      const mintPartialSigner = getRandomPartialSigner(smartWallet);

      const instructions: TXInstruction[] = [
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
      const smartWalletInfo = await program.account.smartWallet.fetch(
        smartWallet
      );

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
      await (
        await executeTransaction(
          program,
          createMintTransaction,
          walletDerivedIndex
        )
      ).rpc();
    });
  });

  describe("Interpret create mint", () => {
    let interpretCreateMintTransactions: PublicKey[];
    it("Interpret create mint", async () => {
      const mintInterpreted = Keypair.generate();
      const mintInterpretedPubkey = mintInterpreted.publicKey;

      const instructions: TransactionInstruction[] = [
        SystemProgram.createAccount({
          fromPubkey: treasury,
          newAccountPubkey: mintInterpretedPubkey,
          lamports: await getMinimumBalanceForRentExemptMint(connection),
          space: MINT_SIZE,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
          mintInterpretedPubkey,
          9,
          treasury,
          treasury
        ),
      ];

      const transaction = new Transaction({
        feePayer: treasury,
        recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
      }).add(...instructions);
      transaction.partialSign(mintInterpreted);

      const { interpreted, txPubkeys } = await TxInterpreter.multisig(
        program,
        smartWallet,
        [transaction]
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
        await (
          await executeTransaction(program, txPubkey, walletDerivedIndex)
        ).rpc();
      }
    });

    // This fails because mintInterpretedPubkey is changed to a PDA signer, but not updated here.
    // it("Interpret create associated token account", async () => {
    //   const ataPk = await getAssociatedTokenAddress(
    //     mintInterpretedPubkey,
    //     treasury,
    //     true
    //   );
    //   const ataInstruction = createAssociatedTokenAccountInstruction(
    //     treasury,
    //     ataPk,
    //     treasury,
    //     mintInterpretedPubkey
    //   );

    //   const transaction = new Transaction().add(ataInstruction);

    //   const { interpreted, txPubkeys } = await TxInterpreter.multisig(
    //     program,
    //     smartWallet,
    //     [transaction]
    //   );
    //   wallet.signAllTransactions(interpreted);

    //   await provider.sendAll(
    //     interpreted.map((tx) => {
    //       return { tx };
    //     })
    //   );

    //   for (const txPubkey of txPubkeys) {
    //     await (
    //       await executeTransaction(program, txPubkey, walletDerivedIndex)
    //     ).rpc();
    //   }
    // });
  });

  // This fails because the mint is changed to a PDA signer but ata is not changed as well
  // describe("Interpret create asssociated token account", () => {
  //   it("Interpret create associated token account", async () => {
  //     const mint = Keypair.generate();
  //     const mintPubkey = mint.publicKey;
  //     const ataPk = await getAssociatedTokenAddress(mintPubkey, treasury, true);

  //     const instructions: TransactionInstruction[] = [
  //       SystemProgram.createAccount({
  //         fromPubkey: treasury,
  //         newAccountPubkey: mintPubkey,
  //         lamports: await getMinimumBalanceForRentExemptMint(connection),
  //         space: MINT_SIZE,
  //         programId: TOKEN_PROGRAM_ID,
  //       }),
  //       createInitializeMintInstruction(mintPubkey, 9, treasury, treasury),
  //       createAssociatedTokenAccountInstruction(
  //         treasury,
  //         ataPk,
  //         treasury,
  //         mintPubkey
  //       ),
  //     ];

  //     const transaction = new Transaction({
  //       feePayer: treasury,
  //       recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
  //     }).add(...instructions);
  //     transaction.partialSign(mint);

  //     const { interpreted, txPubkeys } = await TxInterpreter.multisig(
  //       program,
  //       smartWallet,
  //       [transaction]
  //     );
  //     wallet.signAllTransactions(interpreted);

  //     await provider.sendAll(
  //       interpreted.map((tx) => {
  //         return { tx };
  //       })
  //     );

  //     for (const txPubkey of txPubkeys) {
  //       await (
  //         await executeTransaction(program, txPubkey, walletDerivedIndex)
  //       ).rpc();
  //     }
  //   });
  // });
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
