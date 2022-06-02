import { createTheme, NextUIProvider } from "@nextui-org/react";
import { ReactNode } from "react";
import { AutoConnectProvider } from "./AutoConnect";
import { SmartWalletProvider } from "./SmartWalletContext";
import { WalletConnectProvider } from "./WalletConnectContext";
import { WalletContextProvider } from "./WalletContext";

let theme = createTheme({ type: "dark" });

export const ContextProviders = ({ children }: { children: ReactNode }) => {
  return (
    <AutoConnectProvider>
      <WalletContextProvider>
        <SmartWalletProvider>
          <WalletConnectProvider>
            <NextUIProvider theme={theme}>{children}</NextUIProvider>
          </WalletConnectProvider>
        </SmartWalletProvider>
      </WalletContextProvider>
    </AutoConnectProvider>
  );
};
