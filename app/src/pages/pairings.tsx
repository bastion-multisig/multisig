import PageHeader from "@/components/PageHeader";
import PairingCard from "@/components/PairingCard";
import { walletConnectClient } from "@/utils/WalletConnectUtil";
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
    <>
      <PageHeader title="Pairings" />
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
    </>
  );
}
