import { ReactNode } from "react";
import { AutoConnectProvider } from "./AutoConnect";
import { WalletContextProvider } from "./WalletContext";

export const ContextProviders = ({ children }: { children: ReactNode }) => {
  return (
    <AutoConnectProvider>
      <WalletContextProvider>{children}</WalletContextProvider>
    </AutoConnectProvider>
  );
};
