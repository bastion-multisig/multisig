import { AccountMeta, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";

export function getUniqueKeys(instructions: TransactionInstruction[]) {
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

/** Return a random u64 by combining 2 random u32s */
export function randomU64() {
  const min = 0;
  const max = 2 ** 32;
  let firstHalf = Math.floor(Math.random() * (max - min) + min);
  let secondHalf = Math.floor(Math.random() * (max - min) + min);
  const word = new BN(firstHalf).add(new BN(secondHalf).ushln(32));
  return word;
}
