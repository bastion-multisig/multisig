import { PublicKey } from "@solana/web3.js";

export function shortenAddress(address: PublicKey, chars = 4): string {
  let str = address.toBase58();
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
}
