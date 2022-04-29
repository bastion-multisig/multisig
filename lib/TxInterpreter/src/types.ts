import { MultisigInstruction } from "./multisigInstruction";
import {
  AllAccountsMap,
  IdlTypes,
  TypeDef,
} from "@project-serum/anchor/dist/cjs/program/namespace/types";
import { SmartWallet } from "./idl/smart_wallet";

export type SmartWalletData = TypeDef<
  AllAccountsMap<SmartWallet>["smartWallet"],
  IdlTypes<SmartWallet>
>;
export type SmartWalletTransactionData = Omit<
  TypeDef<AllAccountsMap<SmartWallet>["transaction"], IdlTypes<SmartWallet>>,
  "instructions"
> & {
  instructions: MultisigInstruction[];
};
export type InstructionBufferData = TypeDef<
  AllAccountsMap<SmartWallet>["instructionBuffer"],
  IdlTypes<SmartWallet>
>;
export type SubaccountInfoData = TypeDef<
  AllAccountsMap<SmartWallet>["subaccountInfo"],
  IdlTypes<SmartWallet>
>;
