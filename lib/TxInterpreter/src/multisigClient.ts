import { MultisigInstruction, PartialSigner } from "./multisigInstruction";
import { AnchorProvider, Program, BN } from "@project-serum/anchor";
import {
  AccountMeta,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  findTransactionAddress,
  findWalletDerivedAddress,
  findWalletPartialSignerAddress,
} from "./pda";
import { SmartWalletData, SmartWalletTransactionData } from "./types";
import { SmartWallet } from "./idl/smart_wallet";

export function multisigSize(owners: number) {
  return owners * 32 + 96;
}

export function createTransaction(
  program: Program<SmartWallet>,
  smartWallet: PublicKey,
  smartWalletInfo: SmartWalletData,
  instructions: MultisigInstruction[]
) {
  const provider = program.provider as AnchorProvider;
  const txIndex = smartWalletInfo.numTransactions.toNumber();
  const [transaction, transactionBump] = findTransactionAddress(
    smartWallet,
    txIndex
  );

  const builder = program.methods
    .createTransaction(transactionBump, instructions)
    .accounts({
      smartWallet,
      transaction,
      proposer: provider.wallet.publicKey,
      payer: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    });

  return { address: transaction, builder };
}

export async function executeTransaction(
  program: Program<SmartWallet>,
  transaction: PublicKey,
  walletDerivedIndex: BN
) {
  const { accounts, remainingAccounts, walletBump } =
    await executeTransactionContext(program, transaction, walletDerivedIndex);

  return program.methods
    .executeTransactionDerived(new BN(walletDerivedIndex), walletBump)
    .accounts(accounts)
    .remainingAccounts(remainingAccounts);
}

async function executeTransactionContext(
  program: Program<SmartWallet>,
  transaction: PublicKey,
  walletDerivedIndex: BN
) {
  const txInfo = (await program.account.transaction.fetch(
    transaction
  )) as SmartWalletTransactionData;
  const smartWallet = txInfo.smartWallet;

  const remainingAccounts = getUniqueKeys((txInfo as any).instructions);

  for (let i = 0; i < remainingAccounts.length; i++) {
    if (remainingAccounts[i].isSigner) {
      remainingAccounts[i].isSigner = false;
    }
  }

  const [_walletDerivedAddress, walletBump] = findWalletDerivedAddress(
    smartWallet,
    walletDerivedIndex
  );

  return {
    accounts: {
      smartWallet: txInfo.smartWallet,
      transaction,
    },
    remainingAccounts,
    walletBump,
  };
}

function getUniqueKeys(instructions: TransactionInstruction[]) {
  // Concat all keys and programIds into a AccountMeta[]
  const keys = instructions.flatMap((ix) =>
    ix.keys.concat({ pubkey: ix.programId, isSigner: false, isWritable: false })
  );

  const unique: Record<string, AccountMeta> = {};

  // Dedupe keys
  for (const key of keys) {
    const keyStr = key.pubkey.toBase58();
    const entry = unique[keyStr];
    if (entry) {
      entry.isSigner ||= key.isSigner;
      entry.isWritable ||= key.isWritable;
    } else {
      unique[keyStr] = { ...key };
    }
  }
  return Object.values(unique);
}

export function getRandomPartialSigner(smartWallet: PublicKey): PartialSigner {
  const index = randomU64();
  const [pubkey, bump] = findWalletPartialSignerAddress(smartWallet, index);
  return {
    index,
    bump,
    pubkey,
  };
}

/** Return a random u64 by combining 2 random u32s */
function randomU64() {
  const min = 0;
  const max = 2 ** 32;
  let firstHalf = Math.floor(Math.random() * (max - min) + min);
  let secondHalf = Math.floor(Math.random() * (max - min) + min);
  const word = new BN(firstHalf).add(new BN(secondHalf).ushln(32));
  return word;
}
