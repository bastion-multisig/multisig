import useInitialization from "@/hooks/useInitialization";
import useWalletConnectEventsManager from "@/hooks/useWalletConnectEventsManager";
import { ReactNode } from "react";

export const WalletConnectProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  // Step 1 - Initialize wallets and wallet connect client
  useInitialization();

  // Step 2 - Once initialized, set up wallet connect event manager
  useWalletConnectEventsManager();

  return <>{children}</>;
};
