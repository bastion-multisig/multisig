import { Program } from "@project-serum/anchor";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { SmartWallet } from "../../../deps/smart_wallet";
import { createTransaction } from "./multisigClient";
export class TxInterpreter {
  /**
   * Rewrites transactions such that it will be uploaded to a 'Transaction'
   * account in the serum multisig program instead of executed.
   * The application is responsible for the wallet signature.
   */
  static async multisig(
    program: Program<SmartWallet>,
    smartWallet: PublicKey,
    proposer: PublicKey,
    ...transactions: Transaction[]
  ): Promise<{
    interpreted: Transaction[];
    txPubkeys: PublicKey[];
  }> {
    const interpreted: Transaction[] = [];
    const txPubkeys: PublicKey[] = [];

    for (let i = 0; i < transactions.length; i++) {
      let transaction = transactions[i];

      // Building phase
      const { address, interpreted: tx } = await this.wrapTransactionInMultisig(
        program,
        smartWallet,
        proposer,
        transaction
      );

      interpreted.push(tx);
      txPubkeys.push(address);
    }

    return {
      interpreted,
      txPubkeys,
    };
  }

  /** Wrap instructions to be invoked by the multisig program */
  private static async wrapTransactionInMultisig(
    program: Program<SmartWallet>,
    smartWallet: PublicKey,
    proposer: PublicKey,
    tx: Transaction
  ) {
    const { transaction, builder } = await createTransaction(
      program,
      smartWallet,
      proposer,
      tx.instructions
    );
    const interpreted = await builder.transaction();

    interpreted.recentBlockhash = tx.recentBlockhash;
    interpreted.feePayer = tx.feePayer;

    return { address: transaction, interpreted };
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
