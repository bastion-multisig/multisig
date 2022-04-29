import PageHeader from "@/components/PageHeader";
import SessionCard from "@/components/SessionCard";
import { walletConnectClient } from "@/utils/WalletConnectUtil";
import { Text } from "@nextui-org/react";
import { useState } from "react";

export default function SessionsPage() {
  const [sessions, setSessions] = useState(walletConnectClient.session.values);

  return (
    <>
      <PageHeader title="Sessions" />
      {sessions.length ? (
        sessions.map((session) => {
          const { name, icons, url } = session.peer.metadata;

          return (
            <SessionCard
              key={session.topic}
              topic={session.topic}
              name={name}
              logo={icons[0]}
              url={url}
            />
          );
        })
      ) : (
        <Text css={{ opacity: "0.5", textAlign: "center", marginTop: "$20" }}>
          No sessions
        </Text>
      )}
    </>
  );
}
