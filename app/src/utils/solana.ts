import { Address, translateAddress } from "@project-serum/anchor";

export function shortenAddress(address: Address, chars = 4): string {
  let str = translateAddress(address).toBase58();
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
}
