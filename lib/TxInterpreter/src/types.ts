import { BN, Idl } from "@project-serum/anchor";
import { IdlTypeDef } from "@project-serum/anchor/dist/cjs/idl";
import {
  AccountMap,
  AllAccountsMap,
  IdlTypes,
  TypeDef,
} from "@project-serum/anchor/dist/cjs/program/namespace/types";
import { PublicKey } from "@solana/web3.js";
import { SmartWallet } from "./idl/smart_wallet";

/****************************
 * Anchor program type definitions.
 * Anchor 0.24.2 exports `AllAccountsMap` and `AllInstructionsMap`.
 * Here we export `AllTypesMap` to generate interfaces for types in `SmartWallet` IDL.
 ****************************/

type AllTypes<IDL extends Idl> = IDL["types"] extends undefined
  ? IdlTypeDef
  : NonNullable<IDL["types"]>[number];
type AllTypesMap<IDL extends Idl> = AccountMap<AllTypes<IDL>>;

/****************************
 * Program Accounts
 ****************************/

export type SmartWalletData = TypeDef<
  AllAccountsMap<SmartWallet>["smartWallet"],
  IdlTypes<SmartWallet>
>;
export type SmartWalletTransactionData = TypeDef<
  AllAccountsMap<SmartWallet>["transaction"],
  IdlTypes<SmartWallet>
>;
export type InstructionBufferData = TypeDef<
  AllAccountsMap<SmartWallet>["instructionBuffer"],
  IdlTypes<SmartWallet>
>;
export type SubaccountInfoData = TypeDef<
  AllAccountsMap<SmartWallet>["subaccountInfo"],
  IdlTypes<SmartWallet>
>;

/****************************
 * Program Types
 ****************************/

export type InstructionBundle = TypeDef<
  AllTypesMap<SmartWallet>["InstructionBundle"],
  IdlTypes<SmartWallet>
>;
export type PartialSigner = TypeDef<
  AllTypesMap<SmartWallet>["PartialSigner"],
  IdlTypes<SmartWallet>
>;
export type SubaccountType = TypeDef<
  AllTypesMap<SmartWallet>["SubaccountType"],
  IdlTypes<SmartWallet>
>;
export type TXAccountMeta = TypeDef<
  AllTypesMap<SmartWallet>["TXAccountMeta"],
  IdlTypes<SmartWallet>
>;
export type TXAccountMetaArg = TypeDef<
  AllTypesMap<SmartWallet>["TXAccountMetaArg"],
  IdlTypes<SmartWallet>
>;
export type TXInstruction = TypeDef<
  AllTypesMap<SmartWallet>["TXInstruction"],
  IdlTypes<SmartWallet>
> & {
  programId: PublicKey;
  keys: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[];
  data: Buffer;
  partialSigners: {
    index: BN;
    bump: number;
  }[];
};
export type TXInstructionArg = TypeDef<
  AllTypesMap<SmartWallet>["TXInstructionArg"],
  IdlTypes<SmartWallet>
> & {
  keys: { isSigner: boolean; isWritable: boolean }[];
  data: Buffer;
  partialSigners: {
    index: BN;
    bump: number;
  }[];
};

/** A partial signer that signs things for a SmartWallet */
export interface PartialSignerAndKey {
  /** The partial signer index seed */
  index: BN;
  /** The partial signer bump seed */
  bump: number;
  /** The resulting public key of the signer seeds. */
  pubkey: PublicKey;
}
