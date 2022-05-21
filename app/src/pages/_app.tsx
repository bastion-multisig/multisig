import Layout from "@/components/Layout";
import Modal from "@/components/Modal";
import { ContextProviders } from "@/contexts/Contexts";
import { AppProps } from "next/app";
import "../../public/main.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { useState } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const [initialized, setInitialized] = useState(false);
  return (
    <>
      <ContextProviders isInitialized={setInitialized}>
        <Layout initialized={initialized}>
          <Component {...pageProps} />
        </Layout>

        <Modal />
      </ContextProviders>
    </>
  );
}
