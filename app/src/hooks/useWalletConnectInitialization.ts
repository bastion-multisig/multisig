import WalletConnectClient from '@walletconnect/client';
import { createWalletConnectClient } from 'actions/createWalletConnectClient';
import { useEffect, useState } from "react";

export default function useWalletConnectInitializer() {
  const [walletConnectClient, setWalletConnectClient] = useState<WalletConnectClient | undefined>();

  useEffect(() => {
    let abort = false;

    createWalletConnectClient()
      .then(client => {
        !abort && setWalletConnectClient(client)
      })
      .catch(alert);

    return () => { abort=true }
  }, []);

  return walletConnectClient;
}
