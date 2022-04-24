import { TxInterpreter } from "./txIntepreter";
import { MultisigInstruction, PartialSigner } from "./multisigInstruction";
import { AnchorProvider, Program, BN, Wallet } from "@project-serum/anchor";
import {
  AccountMeta,
  Keypair,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { SmartWallet } from "../../../deps/smart_wallet";
import {
  findTransactionAddress,
  findWalletDerivedAddress,
  findWalletPartialSignerAddress,
} from "./pda";
import { SmartWalletTransactionData } from "./types";

export function multisigSize(owners: number) {
  return owners * 32 + 96;
}

export async function createTransaction(
  program: Program<SmartWallet>,
  smartWallet: PublicKey,
  proposer: PublicKey,
  instructions: MultisigInstruction[]
) {
  const provider = program.provider as AnchorProvider;
  const multisigInfo = await program.account.smartWallet.fetch(smartWallet);
  const txIndex = multisigInfo.numTransactions.toNumber();
  const [transaction, transactionBump] = await findTransactionAddress(
    smartWallet,
    txIndex
  );

  const builder = program.methods
    .createTransaction(transactionBump, instructions)
    .accounts({
      smartWallet,
      transaction,
      proposer,
      payer: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    });

  return { address: transaction, builder };
}

export async function executeTransaction(
  program: Program<SmartWallet>,
  transaction: PublicKey,
  walletIndex: number
) {
  const { accounts, remainingAccounts, walletBump } =
    await executeTransactionContext(program, transaction, walletIndex);

  return await program.methods
    .executeTransactionDerived(new BN(walletIndex), walletBump)
    .accounts(accounts)
    .remainingAccounts(remainingAccounts)
    .rpc();
}

async function executeTransactionContext(
  program: Program<SmartWallet>,
  transaction: PublicKey,
  walletIndex: number
) {
  const txInfo = (await program.account.transaction.fetch(
    transaction
  )) as SmartWalletTransactionData;
  const smartWallet = txInfo.smartWallet;

  const remainingAccounts = getUniqueKeys(txInfo.instructions);

  for (let i = 0; i < remainingAccounts.length; i++) {
    if (remainingAccounts[i].isSigner) {
      remainingAccounts[i].isSigner = false;
    }
  }

  const [_walletDerivedAddress, walletBump] = await findWalletDerivedAddress(
    smartWallet,
    walletIndex
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

function getUniqueKeys(
  instructions: SmartWalletTransactionData["instructions"]
) {
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

export async function getRandomPartialSigner(
  smartWallet: PublicKey
): Promise<PartialSigner> {
  const index = randomU64();
  const [pubkey, bump] = await findWalletPartialSignerAddress(
    smartWallet,
    index
  );
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
