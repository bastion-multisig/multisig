import { PublicKey } from "@solana/web3.js";

export function shortenAddress(address: PublicKey | string, chars = 4): string {
  if (address instanceof PublicKey) {
    address = address.toBase58();
  }
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
