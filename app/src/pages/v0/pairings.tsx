import PairingCard from "../../components/PairingCard";
import LayoutV0 from "../../components/V0/LayoutV0";
import PageHeaderV0 from "../../components/V0/PageHeaderV0";
import { walletConnectClient } from "../../utils/WalletConnectUtil";
import { Text } from "@nextui-org/react";
import { ERROR } from "@walletconnect/utils";
import { useState } from "react";

export default function PairingsPage() {
  const [pairings, setPairings] = useState(walletConnectClient?.pairing.values);

  async function onDelete(topic: string) {
    if (walletConnectClient && pairings) {
      await walletConnectClient.pairing.delete({
        topic,
        reason: ERROR.DELETED.format(),
      });
      const newPairings = pairings.filter((pairing) => pairing.topic !== topic);
      setPairings(newPairings);
    }
  }

  return (
    <LayoutV0>
      <PageHeaderV0 title="Pairings" />
      {pairings && pairings.length ? (
        pairings.map((pairing) => {
          const { metadata } = pairing.state;

          return (
            <PairingCard
              key={pairing.topic}
              logo={metadata?.icons[0]}
              url={metadata?.url}
              name={metadata?.name}
              onDelete={() => onDelete(pairing.topic)}
            />
          );
        })
      ) : (
        <Text css={{ opacity: "0.5", textAlign: "center", marginTop: "$20" }}>
          {walletConnectClient ? "No pairings" : "Connecting to Walletconnect"}
        </Text>
      )}
    </LayoutV0>
  );
}
