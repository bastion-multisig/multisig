import ProjectInfoCard from "../../components/ProjectInfoCard";
import SessionSelectSection from "../../components/SessionSelectSection";
import LayoutV0 from "../../components/V0/LayoutV0";
import PageHeaderV0 from "../../components/V0/PageHeaderV0";
import { useSmartWallet } from "../../contexts/SmartWalletContext";
import { SOLANA_CHAINS, TSolanaChain } from "../../data/SolanaChains";
import { isSolanaChain } from "../../utils/HelperUtil";
import { walletConnectClient } from "../../utils/WalletConnectUtil";
import { Button, Col, Divider, Row, Text } from "@nextui-org/react";
import { ERROR } from "@walletconnect/utils";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

/**
 * Component
 */
export default function SessionPage() {
  const { walletPubkey } = useSmartWallet();
  const [topic, setTopic] = useState("");
  const [updated, setUpdated] = useState(new Date());
  const { query, replace } = useRouter();

  const addresses = walletPubkey ? [walletPubkey.toBase58()] : [];

  useEffect(() => {
    if (query?.topic) {
      setTopic(query.topic as string);
    }
  }, [query]);

  const session = walletConnectClient?.session.values.find(
    (s) => s.topic === topic
  );

  if (!session) {
    return null;
  }

  // Get necessary data from session
  const expiryDate = new Date(session.expiry * 1000);
  const { chains } = session.permissions.blockchain;
  const { methods } = session.permissions.jsonrpc;
  const { accounts } = session.state;

  // Handle deletion of a session
  async function onDeleteSession() {
    await walletConnectClient?.session.delete({
      topic,
      reason: ERROR.DELETED.format(),
    });
    replace("/sessions");
  }

  // Hanlde deletion of session account
  async function onDeleteAccount(account: string) {
    const newAccounts = accounts.filter((a) => a !== account);
    await walletConnectClient?.session.update({
      topic,
      state: {
        accounts: newAccounts,
      },
    });
    setUpdated(new Date());
  }

  // Handle addition of account to the session
  async function onAddAccount(account: string) {
    await walletConnectClient?.session.update({
      topic,
      state: {
        accounts: [...accounts, account],
      },
    });
    setUpdated(new Date());
  }

  return (
    <LayoutV0>
      <PageHeaderV0 title="Session Details" />

      <ProjectInfoCard metadata={session.peer.metadata} />

      {chains.map((chain) => {
        if (isSolanaChain(chain)) {
          return (
            <SessionSelectSection
              key={chain}
              chain={chain}
              name={SOLANA_CHAINS[chain as TSolanaChain]?.name}
              addresses={addresses}
              selectedAddresses={accounts}
              onDelete={onDeleteAccount}
              onAdd={onAddAccount}
            />
          );
        }
      })}

      <Divider y={1} />

      <Row>
        <Col>
          <Text h5>Methods</Text>
          <Text color="$gray400">
            {methods.map((method) => method).join(", ")}
          </Text>
        </Col>
      </Row>

      <Divider y={1} />

      <Row justify="space-between">
        <Text h5>Expiry</Text>
        <Text css={{ color: "$gray400" }}>{expiryDate.toDateString()}</Text>
      </Row>

      <Divider y={1} />

      <Row justify="space-between">
        <Text h5>Last Updated</Text>
        <Text css={{ color: "$gray400" }}>{updated.toDateString()}</Text>
      </Row>

      <Divider y={1} />

      <Row>
        <Button
          flat
          css={{ width: "100%" }}
          color="error"
          onClick={onDeleteSession}
        >
          Delete Session
        </Button>
      </Row>
    </LayoutV0>
  );
}
