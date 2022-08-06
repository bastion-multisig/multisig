import { AnchorProvider, BN, Program } from "@project-serum/anchor";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { PartialSigner } from "./idl/partial_signer";
import { SmartWallet } from "./idl/smart_wallet";
import {
  createMultisigTransaction,
  getRandomMultisigPartialSigners,
  keysToMultisigSubaccounts,
} from "./multisigClient";
import { keysToPartialSigner } from "./partialSignerUtil";
import { findPartialSignerSetAddress } from "./pda";
import { getUniqueKeys, getUniqueKeysMultisig } from "./transactionUtil";
import {
  TXInstruction,
  SmartWalletData,
  MultisigPartialSignerAndKey,
  InstructionData,
} from "./types";
import assert from "assert";

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
    const signerKeys = getUniqueKeysMultisig(
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
    partialSigners: Record<string, MultisigPartialSignerAndKey>
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
    partialSigners: Record<string, MultisigPartialSignerAndKey>
  ) {
    let programId = instruction.programId;
    const keys = [...instruction.keys];
    const data = Buffer.from(instruction.data);
    const partialSignersInInstruction: Record<
      string,
      MultisigPartialSignerAndKey
    > = {};

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
    program: Program<PartialSigner>,
    authority: PublicKey,
    partialSignerSetSeed: PublicKey,
    transactions: (InstructionData[] | null)[]
  ): Promise<TransactionInstruction[][]> {
    const signerKeys = getUniqueKeys(
      (transactions.filter((tx) => tx) as InstructionData[][]).flat()
    )
      .filter((meta) => meta.isSigner && !meta.pubkey.equals(authority))
      .map((meta) => meta.pubkey.toBase58())
      .filter((value, index, self) => self.indexOf(value) === index)
      .map((value) => new PublicKey(value));

    const partialSigners = keysToPartialSigner(authority, signerKeys);

    let hasPartialSigners = transactions.flat().some((ix) => {
      if (ix && partialSigners[ix.programId.toBase58()]) {
        return true;
      }
      return (
        ix && ix.accounts.some((key) => partialSigners[key.pubkey.toBase58()])
      );
    });

    if (!hasPartialSigners) {
      return (transactions.filter((tx) => tx) as InstructionData[][]).map(
        (tx) =>
          tx.map(
            (ix) =>
              new TransactionInstruction({
                programId: ix.programId,
                keys: ix.accounts,
                data: Buffer.from(ix.data),
              })
          )
      );
    }

    let proposalInstructions: TransactionInstruction[][] = [];
    const partialSignerSet = findPartialSignerSetAddress(
      authority,
      partialSignerSetSeed
    );

    const initSetInstruction = await program.methods
      .initPartialSignerSet(partialSignerSetSeed, signerKeys, signerKeys.length)
      .accounts({
        authority,
        payer: authority,
        partialSignerSet,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
    const freezeSetInstruction = await program.methods
      .freezePartialSignerSet()
      .accounts({
        authority,
        partialSignerSet,
      })
      .instruction();
    proposalInstructions.push([initSetInstruction, freezeSetInstruction]);

    for (const instructions of transactions) {
      if (instructions) {
        let ix = await this.buildProposalTransaction(
          program,
          instructions,
          authority,
          partialSigners,
          partialSignerSet
        );
        proposalInstructions.push(ix);
      }
    }

    return proposalInstructions;
  }

  private static async buildProposalTransaction(
    program: Program<PartialSigner>,
    instructions: InstructionData[],
    authority: PublicKey,
    partialSigners: Record<string, PublicKey | undefined>,
    partialSignerSet: PublicKey
  ): Promise<TransactionInstruction[]> {
    const interpreted: TransactionInstruction[] = [];
    for (let i = 0; i < instructions.length; i++) {
      interpreted[i] = await this.buildProposalInstruction(
        program,
        instructions[i],
        authority,
        partialSigners,
        partialSignerSet
      );
    }

    return interpreted;
  }

  private static async buildProposalInstruction(
    program: Program<PartialSigner>,
    instruction: InstructionData,
    authority: PublicKey,
    partialSigners: Record<string, PublicKey | undefined>,
    partialSignerSet: PublicKey
  ) {
    let programId = instruction.programId;
    const keys = [...instruction.accounts];
    const data = Buffer.from(instruction.data);

    let instrurctionHasPartialSigners = false;

    // Subsitute program id
    const keyStr = programId.toBase58();
    const signer = partialSigners[keyStr];
    if (signer) {
      programId = signer;
      instrurctionHasPartialSigners = true;
    }

    for (let i = 0; i < keys.length; i++) {
      let key = instruction.accounts[i];
      const partialSigner = partialSigners[key.pubkey.toBase58()];
      if (partialSigner) {
        keys[i] = {
          pubkey: partialSigner,
          isSigner: false, // Becomes true during execution
          isWritable: key.isWritable,
        };
        instrurctionHasPartialSigners = true;
      }
    }

    // Subsitute pubkeys that have been encoded in data
    for (const keyStr in partialSigners) {
      let index = -1;
      while (true) {
        const key = new PublicKey(keyStr).toBytes();
        index = data.indexOf(key);
        if (index == -1) {
          break;
        }
        const signer = partialSigners[keyStr];
        assert(signer);
        signer.toBuffer().copy(data, index, 0, 32);

        // This doesn't require setting instructionHasPartialSigners to true.
        // Because it's not a requirement to sign if it's found in data
      }
    }

    if (!instrurctionHasPartialSigners) {
      return new TransactionInstruction({
        programId,
        keys,
        data,
      });
    }

    let ix = await program.methods
      .invokeSigned(data)
      .accounts({
        authority,
        partialSignerSet,
        programId: programId,
      })
      .remainingAccounts(keys)
      .instruction();
    return ix;
  }
}
