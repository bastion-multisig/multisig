import { SmartWalletContextState } from "../contexts/SmartWalletContext";
import {
  SmartWalletTransactionData,
  executeMultisigTransaction,
} from "@bastion-multisig/multisig-tx";
import { BN, ProgramAccount } from "@project-serum/anchor";

export async function executeTransaction(
  { program }: SmartWalletContextState,
  transaction: ProgramAccount<SmartWalletTransactionData>,
  walletDerivedIndex: BN
) {
  return await (
    await executeMultisigTransaction(
      program,
      transaction.publicKey,
      walletDerivedIndex
    )
  ).rpc();
}
