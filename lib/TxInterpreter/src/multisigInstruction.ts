import { BN } from "@project-serum/anchor";
import { AccountMeta, PublicKey } from "@solana/web3.js";

export interface MultisigInstruction {
  /**
   * Public keys to include in this transaction
   * Boolean represents whether this pubkey needs to sign the transaction
   */
  keys: AccountMeta[];
  /**
   * Program Id to execute
   */
  programId: PublicKey;
  /**
   * Program input
   */
  data: Buffer;

  /** Partial signers that signs things for a SmartWallet */
  partialSigners: PartialSigner[];
}

/** A partial signer that signs things for a SmartWallet */
export interface PartialSigner {
  /** The partial signer index seed */
  index: BN;
  /** The partial signer bump seed */
  bump: number;
  /** The resulting public key of the signer seeds. */
  pubkey: PublicKey;
}
