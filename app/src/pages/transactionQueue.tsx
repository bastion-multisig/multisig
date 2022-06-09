import PageHeader from "@/components/PageHeader";
import { TransactionGroup } from "@/components/Transactions/TransactionGroup";
import { useSmartWallet } from "@/contexts/SmartWalletContext";
import { useEffect } from "react";

export default function TransactionQueuePage() {
  const { walletPubkey, transactionQueue, transactionHistory, refresh } =
    useSmartWallet();

  // Grab the latest transactions when visiting
  useEffect(() => {
    refresh();
  }, []);

  return (
    <>
      <PageHeader title="Transactions" />
      {transactionQueue && (
        <TransactionGroup
          header="Transaction Queue"
          transactions={transactionQueue}
        />
      )}
      {transactionHistory && (
        <TransactionGroup
          header="Transaction History"
          transactions={transactionHistory}
        />
      )}
    </>
  );
}
