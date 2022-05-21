import useInitialization from "@/hooks/useInitialization";
import useWalletConnectEventsManager from "@/hooks/useWalletConnectEventsManager";
import { ReactNode } from "react";

export const WalletConnectProvider = ({
  isInitialized,
  children,
}: {
  isInitialized: (initialized: boolean) => void;
  children: ReactNode;
}) => {
  // Step 1 - Initialize wallets and wallet connect client
  const initialized = useInitialization();

  // Step 2 - Once initialized, set up wallet connect event manager
  useWalletConnectEventsManager(initialized);

  isInitialized(initialized);

  return <>{children}</>;
};
