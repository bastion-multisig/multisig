import Layout from "@/components/Layout";
import Modal from "@/components/Modal";
import { ContextProviders } from "@/contexts/Contexts";
import { AppProps } from "next/app";
import "../../public/main.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { useState } from "react";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ContextProviders>
      <Layout>
        <Component {...pageProps} />
      </Layout>

      <Modal />
    </ContextProviders>
  );
}
