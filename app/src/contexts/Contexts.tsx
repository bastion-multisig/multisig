import { createTheme, NextUIProvider } from "@nextui-org/react";
import { ReactNode } from "react";
import { AutoConnectProvider } from "./AutoConnect";
import { WalletContextProvider } from "./WalletContext";

let theme = createTheme({ type: "dark" });

export const ContextProviders = ({ children }: { children: ReactNode }) => {
  return (
    <AutoConnectProvider>
      <WalletContextProvider>
        <NextUIProvider theme={theme}>{children}</NextUIProvider>
      </WalletContextProvider>
    </AutoConnectProvider>
  );
};