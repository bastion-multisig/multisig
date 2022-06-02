import PageHeader from "@/components/PageHeader";
import { TransactionGroup } from "@/components/Transactions/TransactionGroup";
import { useSmartWallet } from "@/contexts/SmartWalletContext";
import { Text } from "@nextui-org/react";
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
        <>
          <Text h4 css={{ marginBottom: "$5" }}>
            Transaction Queue
          </Text>
          <TransactionGroup
            header="Transaction Queue"
            transactions={transactionQueue}
          />
        </>
      )}
      {transactionHistory && (
        <>
          <Text h4 css={{ marginBottom: "$5" }}>
            Transaction History
          </Text>
          <TransactionGroup
            header="Transaction History"
            transactions={transactionHistory}
          />
        </>
      )}
    </>
  );
}
