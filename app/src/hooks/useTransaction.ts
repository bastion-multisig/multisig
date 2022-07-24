import { useSmartWallet } from "../contexts/SmartWalletContext";
import { NOT_EXECUTED } from "../data/SolanaChains";
import { bnToNumber } from "../utils/bn";
import { SmartWalletTransactionData } from "@bastion-multisig/multisig-tx";
import { BN, ProgramAccount } from "@project-serum/anchor";
import { useSmartWalletOwnerIndex } from "./useSmartWallet";

export function usetransactionInQueue(
  tx: ProgramAccount<SmartWalletTransactionData>
) {
  return tx.account.executedAt.eq(NOT_EXECUTED);
}

export function useTransactionExecutedTime(
  tx: ProgramAccount<SmartWalletTransactionData>
) {
  return new Date(
    bnToNumber(tx.account.executedAt) * 1000
  ).toLocaleTimeString();
}

export function useTransactionSignatures(
  tx: ProgramAccount<SmartWalletTransactionData>
) {
  const { walletPubkey, smartWallet, smartWalletPk } = useSmartWallet();
  const walletOwnerIndex = useSmartWalletOwnerIndex();
  const areRelated =
    smartWalletPk && tx.account.smartWallet.toBase58() === smartWalletPk;

  const badOwnerSetSeqNo =
    smartWallet &&
    areRelated &&
    smartWallet.ownerSetSeqno !== tx.account.ownerSetSeqno;
  const signatures = tx.account.signers.reduce(
    (count, signer) => (signer ? count + 1 : count),
    0
  );
  const threshold = smartWallet
    ? bnToNumber(smartWallet.threshold)
    : tx.account.signers.length;
  const walletCanSign =
    areRelated &&
    !badOwnerSetSeqNo &&
    walletOwnerIndex >= 0 &&
    walletOwnerIndex < tx.account.signers.length &&
    tx.account.signers[walletOwnerIndex] === false;
  const walletHasSigned =
    areRelated &&
    !badOwnerSetSeqNo &&
    walletOwnerIndex >= 0 &&
    walletOwnerIndex < tx.account.signers.length &&
    tx.account.signers[walletOwnerIndex] === false;

  const hasExecuted = !tx.account.executedAt.eq(NOT_EXECUTED);
  const walletHasExecuted =
    hasExecuted && walletPubkey && tx.account.executor.equals(walletPubkey);
  const canExecute = !hasExecuted && !badOwnerSetSeqNo;
  const walletCanExecute = canExecute && walletOwnerIndex !== -1;

  return {
    badOwnerSetSeqNo,
    signatures,
    threshold,
    walletCanSign,
    walletHasSigned,
    hasExecuted,
    walletHasExecuted,
    canExecute,
    walletCanExecute,
  };
}
