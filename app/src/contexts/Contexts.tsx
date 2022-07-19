import { ReactNode } from "react";
import { AutoConnectProvider } from "./AutoConnect";
import { SmartWalletProvider } from "./SmartWalletContext";
import { WalletConnectProvider } from "./WalletConnectContext";
import { WalletContextProvider } from "./WalletContext";

export const ContextProviders = ({ children }: { children: ReactNode }) => {
  return (
    <AutoConnectProvider>
      <WalletContextProvider>
        <SmartWalletProvider>
          <WalletConnectProvider>{children}</WalletConnectProvider>
        </SmartWalletProvider>
      </WalletContextProvider>
    </AutoConnectProvider>
  );
};
