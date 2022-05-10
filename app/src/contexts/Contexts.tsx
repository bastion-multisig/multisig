import { createTheme, NextUIProvider } from "@nextui-org/react";
import { ReactNode } from "react";
import { AutoConnectProvider } from "./AutoConnect";
import { SmartWalletProvider } from "./SmartWalletContext";
import { WalletContextProvider } from "./WalletContext";

let theme = createTheme({ type: "dark" });

export const ContextProviders = ({ children }: { children: ReactNode }) => {
  return (
    <AutoConnectProvider>
      <WalletContextProvider>
        <SmartWalletProvider>
          <NextUIProvider theme={theme}>{children}</NextUIProvider>
        </SmartWalletProvider>
      </WalletContextProvider>
    </AutoConnectProvider>
  );
};
