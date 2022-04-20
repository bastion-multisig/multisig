import { AnchorProvider, Program } from "@project-serum/anchor";
import {
  Keypair,
  PublicKey,
  Signer,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { SerumMultisig } from "../../../target/types/serum_multisig";
export class TxInterpreter {
  /** Serum Multisig v0.8.0 */
  private static readonly TRANSACTION_ACCOUNT_SIZE = 1000; // TODO: tighter bound.

  /**
   * Rewrites transactions such that it will be uploaded to a 'Transaction'
   * account in the serum multisig program instead of executed.
   */
  static async multisig(
    program: Program<SerumMultisig>,
    multisig: PublicKey,
    proposer: PublicKey,
    ...transactions: Transaction[]
  ): Promise<{
    interpreted: { tx: Transaction; signers?: Signer[] }[];
    txPubkeys: PublicKey[];
  }> {
    const txs: Transaction[] = [];
    const allTxPubkeys: PublicKey[] = [];

    // Replace extra signers for System.CreateAccounts with new keypairs
    // because modifying the tx invalidates existing signatures
    const substituteSigners = transactions
      // Select all but the wallet signer
      .flatMap((tx) => tx.signatures.slice(1))
      // Dedupe signers
      .filter(function (signature, i, arr) {
        return (
          arr.findIndex((sig) => sig.publicKey.equals(signature.publicKey)) == i
        );
      })
      // Add a signer substitute
      .map<SubstituteSigner>((signer) => {
        return {
          ...signer,
          substitute: Keypair.generate(),
        };
      });

    for (let i = 0; i < transactions.length; i++) {
      let transaction = transactions[i];
      let newSigners: Signer[];
      let txPubkeys: PublicKey[];

      // Building phase
      ({ transaction, newSigners, txPubkeys } =
        await this.wrapTransactionInMultisig(
          program,
          multisig,
          proposer,
          transaction
        ));
      this.substituteSigners(substituteSigners, transaction);

      // Signing phase
      // No modification at this point.
      transaction.partialSign(...newSigners);
      this.signSubstitutes(substituteSigners, transaction);
      // The application is responsible for the wallet signature

      txs.push(transaction);
      allTxPubkeys.push(...txPubkeys);
    }

    return {
      interpreted: txs.map((tx) => {
        return {
          tx,
        };
      }),
      txPubkeys: allTxPubkeys,
    };
  }

  /** Wrap instructions to be invoked by the multisig program */
  private static async wrapTransactionInMultisig(
    program: Program<SerumMultisig>,
    multisig: PublicKey,
    proposer: PublicKey,
    transaction: Transaction
  ) {
    const provider = program.provider as AnchorProvider;
    const newInstructions: TransactionInstruction[] = [];

    const newSigners: Signer[] = [];
    const txPubkeys: PublicKey[] = [];

    for (let i = 0; i < transaction.instructions.length; i++) {
      const instruction = transaction.instructions[i];
      const transactionAccount = await Keypair.generate();

      newInstructions.push(
        // Create transaction account
        await program.account.transaction.createInstruction(
          transactionAccount,
          this.TRANSACTION_ACCOUNT_SIZE
        ),
        // Init transaction account
        program.instruction.createTransaction(instruction, {
          accounts: {
            multisig,
            transaction: transactionAccount.publicKey,
            proposer,
          },
        })
      );
      newSigners.push(transactionAccount);
      txPubkeys.push(transactionAccount.publicKey);
    }

    // Build transaction
    transaction = new Transaction({
      ...transaction,
      recentBlockhash: (await provider.connection.getRecentBlockhash())
        .blockhash,
    });
    transaction.instructions = newInstructions;

    return { transaction, newSigners, txPubkeys };
  }

  private static async substituteSigners(
    substituteSigners: SubstituteSigner[],
    transaction: Transaction
  ) {
    transaction.instructions.forEach((instruction) =>
      instruction.keys.forEach((key) => {
        const substituteSigner = substituteSigners.find((sub) =>
          sub.publicKey.equals(key.pubkey)
        );
        if (substituteSigner) {
          key.pubkey = substituteSigner.substitute.publicKey;
        }
      })
    );
  }

  private static async signSubstitutes(
    substituteSigners: SubstituteSigner[],
    transaction: Transaction
  ) {
    if (substituteSigners.length > 0) {
      transaction.partialSign(
        ...substituteSigners.map((sub) => sub.substitute)
      );
    }
  }
}

export class MultisigWalletAdapter implements Wallet {
  constructor(public publicKey: PublicKey) {}

  signAllTransactions(_txs: Transaction[]): Promise<Transaction[]> {
    throw new Error();
  }

  signTransaction(_tx: Transaction): Promise<Transaction> {
    throw new Error();
  }
}

/**
 * Wallet interface for objects that can be used to sign provider transactions.
 */
export interface Wallet {
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
  publicKey: PublicKey;
}

interface SubstituteSigner {
  signature: Buffer | null;
  publicKey: PublicKey;
  substitute: Keypair;
}
