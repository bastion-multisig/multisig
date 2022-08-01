import { AnchorProvider, BN, Program } from "@project-serum/anchor";
import { InstructionData } from "@solana/spl-governance";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { SmartWallet } from "./idl/smart_wallet";
import {
  createMultisigTransaction,
  getRandomMultisigPartialSigners,
  keysToMultisigSubaccounts,
} from "./multisigClient";
import { getUniqueKeys } from "./transactionUtil";
import { TXInstruction, SmartWalletData, PartialSignerAndKey } from "./types";

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
    const signerKeys = getUniqueKeys(
      transactions.flatMap((tx) => tx.instructions)
    )
      .filter((meta) => meta.isSigner)
      .map((meta) => meta.pubkey);

    const subaccounts = await keysToMultisigSubaccounts(
      program,
      smartWallet,
      signerKeys
    );

    // This filter step may be unnesecary
    const signersWithoutMultisigSubaccounts = signerKeys.filter(
      (signer) => !subaccounts[signer.toBase58()]
    );
    const partialSigners = getRandomMultisigPartialSigners(
      smartWallet,
      signersWithoutMultisigSubaccounts
    );
    return await this.buildMultisigTransactions(
      program,
      smartWallet,
      transactions,
      partialSigners
    );
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

      const { address, builder } = createMultisigTransaction(
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

  /**
   * Create a dao proposal instruction. This is different from interpreting a multisig transaction
   * in that the SPL govenance UI will wrap this in spl_goverance::execute_instruction elsewhere.
   * It also isn't necessary to set account_meta::is_signer to false for all keys because keys are
   * stored in instruction data where it isn't validated by the runtime. */
  static async proposal(
    transactions: Transaction[]
  ): Promise<InstructionData[][]> {
    return transactions.map((tx) => {
      return tx.instructions.map<InstructionData>((ix) => {
        return {
          programId: ix.programId,
          accounts: ix.keys,
          data: new Uint8Array(ix.data),
        };
      });
    });
  }
}
