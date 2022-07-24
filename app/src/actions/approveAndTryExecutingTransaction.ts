import { SmartWalletContextState } from "../contexts/SmartWalletContext";
import { bnToNumber } from "../utils/bn";
import {
  findWalletDerivedAddress,
  SmartWalletTransactionData,
  executeTransaction,
} from "@bastion-multisig/multisig-tx";
import { BN, ProgramAccount } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

export async function approveAndTryExecutingTransaction(
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
  const ownerIndex = smartWallet.owners.findIndex((owner) =>
    owner.equals(walletPubkey)
  );
  const willSign =
    ownerIndex !== -1 &&
    ownerIndex < transaction.account.signers.length &&
    transaction.account.signers[ownerIndex] === false;
  const signatures = transaction.account.signers.reduce(
    (count, signer) => (signer ? count + 1 : count),
    0
  );
  const threshold = bnToNumber(smartWallet.threshold);
  const willPassThreshold = signatures + (willSign ? 1 : 0) >= threshold;

  const approveTx = await program.methods
    .approve()
    .accounts({
      smartWallet: smartWalletPk,
      transaction: transaction.publicKey,
      owner: walletPubkey,
    })
    .transaction();

  const [index, bump] = findWalletDerivedAddress(
    new PublicKey(smartWalletPk),
    walletDerivedIndex
  );
  // Execute on a separate transaction to have maximum compute budget
  const executeTx = willPassThreshold
    ? await (
        await executeTransaction(
          program,
          transaction.publicKey,
          walletDerivedIndex
        )
      ).transaction()
    : undefined;

  const transactions = executeTx ? [approveTx, executeTx] : [approveTx];
  const txWithSigners = transactions.map((tx) => {
    return { tx };
  });
  if (!program.provider.sendAll) {
    throw new Error("No wallet");
  }
  return await program.provider.sendAll(txWithSigners);
}
