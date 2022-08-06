import { PublicKey } from "@solana/web3.js";
import { findPartialSignerAddress } from "./pda";

export function keysToPartialSigner(
  authority: PublicKey,
  keys: PublicKey[]
): Record<string, PublicKey | undefined> {
  const addresses: Record<string, PublicKey | undefined> = {};
  for (let i = 0; i < keys.length; i++) {
    addresses[keys[i].toBase58()] = findPartialSignerAddress(
      authority,
      keys[i]
    );
  }
  return addresses;
}
