import { BN } from "@project-serum/anchor";

export function bnToNumber(bn: BN) {
  return Number(bn.toString());
}
