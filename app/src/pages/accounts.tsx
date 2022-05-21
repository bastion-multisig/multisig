import AccountCard from "@/components/AccountCard";
import PageHeader from "@/components/PageHeader";
import { useSmartWallet } from "@/contexts/SmartWalletContext";
import { SOLANA_MAINNET_CHAINS, SOLANA_TEST_CHAINS } from "@/data/SolanaData";
import { Text } from "@nextui-org/react";

export default function HomePage() {
  const { walletPubkey } = useSmartWallet();
  return (
    <>
      <PageHeader title="Accounts" />
      <Text h4 css={{ marginBottom: "$5" }}>
        Mainnets
      </Text>
      {Object.values(SOLANA_MAINNET_CHAINS).map(
        ({ name, logo, rgb }) =>
          walletPubkey && (
            <AccountCard
              key={name}
              name={name}
              logo={logo}
              rgb={rgb}
              address={walletPubkey.toBase58()}
            />
          )
      )}
    </>
  );
}
