import { SmartWalletContextState } from "@/contexts/SmartWalletContext";
import { bnToNumber } from "@/utils/bn";
import {
  findWalletDerivedAddress,
  SmartWalletTransactionData,
} from "@multisig/multisig-tx";
import { BN, ProgramAccount } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

export async function executeTransaction(
  {
    walletPubkey,
    program,
    smartWalletPk,
    smartWallet,
  }: SmartWalletContextState,
  transaction: ProgramAccount<SmartWalletTransactionData>,
  walletDerivedIndex: BN
) {
  if (!walletPubkey) {
    throw new Error("No wallet");
  }
  if (!smartWalletPk || !smartWallet) {
    throw new Error("No smart wallet");
  }

  const [index, bump] = findWalletDerivedAddress(
    new PublicKey(smartWalletPk),
    bnToNumber(walletDerivedIndex)
  );
  return await program.methods
    .executeTransactionDerived(walletDerivedIndex, bump)
    .accounts({
      smartWallet: smartWalletPk,
      transaction: transaction.publicKey,
      owner: walletPubkey,
    })
    .rpc();
}
