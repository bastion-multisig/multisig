import { SmartWalletContextState } from "@/contexts/SmartWalletContext";
import { SmartWalletTransactionData } from "@multisig/multisig-tx";
import { BN, ProgramAccount } from "@project-serum/anchor";
import { executeTransaction as execTransaction } from "@multisig/multisig-tx";

export async function executeTransaction(
  { program }: SmartWalletContextState,
  transaction: ProgramAccount<SmartWalletTransactionData>,
  walletDerivedIndex: BN
) {
  return await (
    await execTransaction(program, transaction.publicKey, walletDerivedIndex)
  ).rpc();
}
