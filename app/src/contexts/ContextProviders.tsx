import { FC, ReactNode } from "react";
import { AutoConnectProvider } from "./AutoConnectProvider";
import { WalletConnectContextProvider } from "./WalletConnectProvider";
import { WalletContextProvider } from "./WalletContextProvider";

export const ContextProviders = ({children}: {children: ReactNode}) => {
  return (
    <AutoConnectProvider>
      <WalletContextProvider>
        <WalletConnectContextProvider>{children}</WalletConnectContextProvider>
      </WalletContextProvider>
    </AutoConnectProvider>
  );
};
