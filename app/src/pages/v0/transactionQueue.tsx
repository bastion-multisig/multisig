import { TransactionGroup } from "../../components/Transactions/TransactionGroup";
import LayoutV0 from "../../components/V0/LayoutV0";
import { useSmartWallet } from "../../contexts/SmartWalletContext";
import { Button, PageHeader } from "antd";
import { useEffect } from "react";

export default function TransactionQueuePage() {
  const { walletPubkey, transactionQueue, transactionHistory, refresh } =
    useSmartWallet();

  // Grab the latest transactions when visiting
  useEffect(() => {
    refresh();
  }, []);

  return (
    <LayoutV0>
      <PageHeader title="Transactions" />
      <Button type="primary" onClick={refresh} style={{ width: 150 }}>
        Refresh
      </Button>
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
    </LayoutV0>
  );
}
