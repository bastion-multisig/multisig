import { SmartWalletContextState } from "../contexts/SmartWalletContext";
import { PublicKey } from "@solana/web3.js";

export async function approveTransaction(
  { walletPubkey, program, smartWalletPk }: SmartWalletContextState,
  transaction: PublicKey
) {
  if (!walletPubkey) {
    throw new Error("No wallet");
  }
  if (!smartWalletPk) {
    throw new Error("No smart wallet");
  }
  return await program.methods
    .approve()
    .accounts({
      smartWallet: smartWalletPk,
      transaction,
      owner: walletPubkey,
    })
    .rpc();
}
