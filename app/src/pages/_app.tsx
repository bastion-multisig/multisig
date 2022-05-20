import Layout from "@/components/Layout";
import Modal from "@/components/Modal";
import { ContextProviders } from "@/contexts/Contexts";
import useInitialization from "@/hooks/useInitialization";
import useWalletConnectEventsManager from "@/hooks/useWalletConnectEventsManager";
import { AppProps } from "next/app";
import "../../public/main.css";
import "@solana/wallet-adapter-react-ui/styles.css";

export default function App({ Component, pageProps }: AppProps) {
  // Step 1 - Initialize wallets and wallet connect client
  const initialized = useInitialization();

  // Step 2 - Once initialized, set up wallet connect event manager
  useWalletConnectEventsManager(initialized);

  return (
    <>
      <ContextProviders>
        <Layout initialized={initialized}>
          <Component {...pageProps} />
        </Layout>

        <Modal />
      </ContextProviders>
    </>
  );
}
