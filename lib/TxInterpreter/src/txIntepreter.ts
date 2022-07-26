import { AnchorProvider, BN, Program } from "@project-serum/anchor";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { SmartWallet } from "./idl/smart_wallet";
import { createTransaction, getRandomPartialSigner } from "./multisigClient";
import { findSubaccountInfoAddress } from "./pda";
import {
  TXInstruction,
  SmartWalletData,
  SubaccountInfoData,
  PartialSignerAndKey,
} from "./types";
export class TxInterpreter {
  /**
   * Rewrites transactions such that it will be uploaded to a 'Transaction'
   * account in the serum multisig program instead of executed.
   * The application is responsible for the wallet signature.
   */
  static async multisig(
    program: Program<SmartWallet>,
    smartWallet: PublicKey,
    transactions: Transaction[]
  ): Promise<{
    interpreted: Transaction[];
    txPubkeys: PublicKey[];
  }> {
    const signers = this.getSigners(transactions);
    const subaccounts = await this.keysToGokiSubaccounts(
      program,
      smartWallet,
      signers
    );
    const filteredSigners = signers.filter(
      (signer) => !subaccounts[signer.toBase58()]
    );
    const partialSigners = this.getRandomPartialSigners(
      smartWallet,
      filteredSigners
    );
    return await this.buildMultisigTransactions(
      program,
      smartWallet,
      transactions,
      partialSigners
    );
  }

  private static getSigners(transactions: Transaction[]) {
    const signers: Record<string, PublicKey> = {};

    for (const tx of transactions) {
      for (const instruction of tx.instructions) {
        for (const key of instruction.keys) {
          if (key.isSigner) {
            signers[key.pubkey.toBase58()] = key.pubkey;
          }
        }
      }
    }

    return Object.values(signers);
  }

  private static async keysToGokiSubaccounts(
    program: Program<SmartWallet>,
    smartWallet: PublicKey,
    keys: PublicKey[]
  ) {
    const addresses: PublicKey[] = [];
    for (let i = 0; i < keys.length; i++) {
      const [address, _bump] = findSubaccountInfoAddress(keys[i]);
      addresses[i] = address;
    }

    let subaccounts = (await program.account.subaccountInfo.fetchMultiple(
      addresses
    )) as (SubaccountInfoData | null)[];

    const map: Record<string, SubaccountInfoData> = {};
    for (let i = 0; i < keys.length; i++) {
      const subaccount = subaccounts[i];
      if (
        subaccount &&
        subaccount.smartWallet.equals(smartWallet) &&
        subaccount.subaccountType.hasOwnProperty("derived")
      ) {
        map[keys[i].toBase58()] = subaccount;
      }
    }
    return map;
  }

  /**
   * For every signer, if the signer does not have a subaccount, return a
   * map of the signer pukbey to a partial signer record.
   */
  private static getRandomPartialSigners(
    smartWallet: PublicKey,
    signers: PublicKey[]
  ) {
    const partialSigners: Record<string, PartialSignerAndKey> = {};
    for (let i = 0; i < signers.length; i++) {
      const signer = signers[i];
      const keyStr = signer.toBase58();
      const partialSigner = partialSigners[keyStr];
      if (!partialSigner) {
        partialSigners[keyStr] = getRandomPartialSigner(smartWallet);
      }
    }
    return partialSigners;
  }

  private static async buildMultisigTransactions(
    program: Program<SmartWallet>,
    smartWallet: PublicKey,
    transactions: Transaction[],
    partialSigners: Record<string, PartialSignerAndKey>
  ) {
    // Overwrite the recent blockhash again so that there is more time for the user to sign
    const { blockhash } =
      await program.provider.connection.getLatestBlockhash();
    const smartWalletInfo: SmartWalletData =
      await program.account.smartWallet.fetch(smartWallet);

    const interpreted: Transaction[] = [];
    const txAddresses: PublicKey[] = [];
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      const transactionIndex = smartWalletInfo.numTransactions.add(new BN(i));
      const multisigInstructions: TXInstruction[] = [];
      for (let j = 0; j < transaction.instructions.length; j++) {
        multisigInstructions[j] = this.buildMultisigInstruction(
          transaction.instructions[j],
          partialSigners
        );
      }

      const { address, builder } = createTransaction(
        program,
        smartWallet,
        transactionIndex,
        multisigInstructions
      );

      const interpretedTx = await builder.transaction();

      interpretedTx.recentBlockhash = blockhash;
      interpretedTx.feePayer = (
        program.provider as AnchorProvider
      ).wallet.publicKey;

      interpreted.push(interpretedTx);
      txAddresses.push(address);
    }

    return {
      interpreted,
      txPubkeys: txAddresses,
    };
  }

  private static buildMultisigInstruction(
    instruction: TransactionInstruction,
    partialSigners: Record<string, PartialSignerAndKey>
  ) {
    let programId = instruction.programId;
    const keys = [...instruction.keys];
    const data = Buffer.from(instruction.data);
    const partialSignersInInstruction: Record<string, PartialSignerAndKey> = {};

    // Subsitute program id
    const keyStr = programId.toBase58();
    const signer = partialSigners[keyStr];
    if (signer) {
      programId = signer.pubkey;
    }

    // Subsitute keys
    for (let j = 0; j < instruction.keys.length; j++) {
      const key = keys[j];
      const keyStr = key.pubkey.toBase58();
      const signer = partialSigners[keyStr];
      if (signer) {
        if (key.isSigner === true) {
          partialSignersInInstruction[keyStr] = signer;
        }

        // Pubkey PDA that the program can sign for. When isSigner is true it
        // requires a matching partialSigner in the same transaction.
        keys[j] = {
          isWritable: key.isWritable,
          isSigner: key.isSigner,
          pubkey: signer.pubkey,
        };
      }
    }

    // Subsitute pubkeys that have been encoded in data
    for (const keyStr in partialSigners) {
      let index = -1;
      while (true) {
        const key = new PublicKey(keyStr).toBytes();
        index = instruction.data.indexOf(key);
        if (index == -1) {
          break;
        }
        const signer = partialSigners[keyStr];
        signer.pubkey.toBuffer().copy(data, index, 0, 32);
      }
    }

    const multisigInstruction: TXInstruction = {
      programId,
      keys,
      data,
      partialSigners: Object.values(partialSignersInInstruction),
    };

    return multisigInstruction;
  }
}
