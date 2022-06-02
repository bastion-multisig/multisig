import { approveAndTryExecutingTransaction } from "@/actions/approveAndTryExecutingTransaction";
import { executeTransaction } from "@/actions/executeTransaction";
import { useSmartWallet } from "@/contexts/SmartWalletContext";
import { DEFAULT_WALLET_DERIVED_INDEX } from "@/data/SolanaChains";
import {
  useTransactionExecutedTime,
  usetransactionInQueue,
  useTransactionSignatures,
} from "@/hooks/useTransaction";
import { SmartWalletTransactionData } from "@multisig/multisig-tx";
import { ProgramAccount } from "@project-serum/anchor";
import { Button } from "antd";

export function TransactionGroupEntry({
  transaction,
}: {
  transaction: ProgramAccount<SmartWalletTransactionData>;
}) {
  const smartWallet = useSmartWallet();

  const inQueue = usetransactionInQueue(transaction);
  const title = inQueue ? "Queued Transaction" : "Executed Transaction";

  const executedTime = useTransactionExecutedTime(transaction);
  const date = inQueue ? "--" : executedTime;

  const {
    badOwnerSetSeqNo,
    signatures,
    threshold,
    walletCanSign,
    walletHasSigned,
    hasExecuted,
    walletHasExecuted,
    canExecute,
    walletCanExecute,
  } = useTransactionSignatures(transaction);

  function onExecuteTransaction() {
    executeTransaction(smartWallet, transaction, DEFAULT_WALLET_DERIVED_INDEX)
      .catch((err: any) => console.log(err))
      .finally(() => smartWallet.refresh());
  }

  function onApproveAndTryExecuteTransaction() {
    approveAndTryExecutingTransaction(
      smartWallet,
      transaction,
      DEFAULT_WALLET_DERIVED_INDEX
    )
      .catch((err: any) => console.log(err))
      .finally(() => smartWallet.refresh());
  }

  return (
    <tr>
      <td>{title}</td>
      <td>{date}</td>
      <td>--</td>
      <td>
        {signatures} out of {threshold}
      </td>
      <td>
        {walletHasExecuted ? (
          "Executed by you"
        ) : hasExecuted ? (
          "Executed"
        ) : walletCanExecute ? (
          <Button onClick={onExecuteTransaction}>Execute</Button>
        ) : canExecute ? (
          "Executable"
        ) : walletHasSigned ? (
          "Approved"
        ) : walletCanSign ? (
          <Button onClick={onApproveAndTryExecuteTransaction}>Approve</Button>
        ) : badOwnerSetSeqNo ? (
          "Owners changed since proposing"
        ) : (
          "--"
        )}
      </td>
    </tr>
  );
}
