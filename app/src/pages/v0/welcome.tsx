import LayoutV0 from "../../components/V0/LayoutV0";
import PageHeaderV0 from "../../components/V0/PageHeaderV0";
import { useSmartWallet } from "../../contexts/SmartWalletContext";
import { shortenAddress } from "../../utils/solana";
import { Button, Card, Text } from "@nextui-org/react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";

export default function WelcomePage() {
  const { smartWallet, treasuryPk } = useSmartWallet();

  return (
    <LayoutV0>
      <PageHeaderV0 title="Welcome" />

      <Text h4 css={{ marginBottom: "$10" }}>
        Get started
      </Text>

      <WalletMultiButton />

      {smartWallet && treasuryPk && (
        <Text css={{ marginBottom: "$10" }}>
          You are connected to Smart Wallet {treasuryPk.toBase58()}
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
          <Link href={"/v0/create"} passHref>
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
          <Link href={"/v0/load"} passHref>
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
    </LayoutV0>
  );
}
