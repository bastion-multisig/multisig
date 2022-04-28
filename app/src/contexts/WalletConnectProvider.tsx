import useWalletConnectInitializer from "hooks/useWalletConnectInitialization";
import WalletConnectClient from "@walletconnect/client";
import { createContext, ReactNode, useContext } from "react";

export interface WalletConnectState {
  walletConnectClient?: WalletConnectClient
}

export const WalletConnectContext = createContext<WalletConnectState>(
  {} as WalletConnectState
);

export function useWalletConnect(): WalletConnectState {
  return useContext(WalletConnectContext);
}

export const WalletConnectContextProvider = ({ children }: {children: ReactNode}) => {
  const walletConnectClient = useWalletConnectInitializer();

  return (
    <WalletConnectContext.Provider value={{
      walletConnectClient
    }}>
      {children}
    </WalletConnectContext.Provider>
  );
};
