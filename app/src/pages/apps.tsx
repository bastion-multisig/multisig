import { Link } from "@nextui-org/react";
import { Layout } from "../components/Layout";

export default function Apps() {
  let devnetLinks: boolean;
  let devnet: string;
  if (process.env.NEXT_PUBLIC_CLUSTER === "devnet") {
    devnetLinks = true;
    devnet = "devnet.";
  } else if (process.env.NEXT_PUBLIC_CLUSTER === "mainnet-beta") {
    devnetLinks = false;
    devnet = "";
  } else {
    return (
      <Layout>
        <p>Unknown cluster {process.env.NEXT_PUBLIC_CLUSTER}</p>
      </Layout>
    );
  }
  return (
    <Layout>
      <h2>{devnetLinks ? "Devnet" : "Mainnet-beta"} Vault Apps</h2>
      <p>
        <Link
          href={`https://raydium-dex.bastion.community`}
          target="_blank"
          rel="noreferrer"
        >
          Raydium Dex {devnetLinks && "(Mainnet-beta only)"}
        </Link>
      </p>
      <p>
        <Link
          href={`https://jet.${devnet}bastion.community`}
          target="_blank"
          rel="noreferrer"
        >
          Jet Protocol
        </Link>
      </p>
      <p>
        <Link
          href={`https://${devnetLinks ? "" : "devnet."}bastion.community/apps`}
        >
          Go to Bastion {devnetLinks ? "Mainnet-beta" : "Devnet"}
        </Link>
      </p>
    </Layout>
  );
}
