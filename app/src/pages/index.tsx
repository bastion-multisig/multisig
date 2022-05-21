import PageHeader from "@/components/PageHeader";
import { useSmartWallet } from "@/contexts/SmartWalletContext";
import { shortenAddress } from "@/utils/solana";
import { Button, Card, Text } from "@nextui-org/react";
import Link from "next/link";

export default function WelcomePage() {
  const { smartWallet, smartWalletPk } = useSmartWallet();

  return (
    <>
      <PageHeader title="Welcome" />

      <Text h4 css={{ marginBottom: "$10" }}>
        Get started
      </Text>

      {smartWallet && smartWalletPk && (
        <Text css={{ marginBottom: "$10" }}>
          You are connected to Smart Wallet {shortenAddress(smartWalletPk)}
        </Text>
      )}

      <Card
        bordered
        borderWeight="light"
        css={{
          marginBottom: "$6",
        }}
      >
        <Card.Body css={{ padding: "var(--nextui-space-lg)" }}>
          <Text h4>Create Smart Wallet</Text>
          <Text css={{ marginTop: "16px" }}>
            Create a new Smart Wallet that is governed by at least one owner.
          </Text>
          <Text css={{ marginTop: "16px" }}>
            A small gas fee will be paid to deploy your new Smart Wallet.
          </Text>
          <Link href={"/create"} passHref>
            <Button size="lg" color="primary" css={{ marginTop: "16px" }}>
              Create new Smart Wallet
            </Button>
          </Link>
        </Card.Body>
      </Card>

      <Card
        bordered
        borderWeight="light"
        css={{
          marginBottom: "$6",
        }}
      >
        <Card.Body css={{ padding: "var(--nextui-space-lg)" }}>
          <Text h4>Add Existing Smart Wallet</Text>
          <Text css={{ marginTop: "16px" }}>
            Access your existing Smart Wallet from a new device or add a one
            created by your team.
          </Text>
          <Link href={"/load"} passHref>
            <Button
              size="lg"
              color="primary"
              bordered
              css={{ marginTop: "16px" }}
            >
              Load existing Smart Wallet
            </Button>
          </Link>
        </Card.Body>
      </Card>
    </>
  );
}
