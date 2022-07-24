import {
  createWalletConnectClient,
  walletConnectClient,
} from "../utils/WalletConnectUtil";
import { useCallback, useEffect, useState } from "react";

export default function useInitialization() {
  const onInitialize = useCallback(async () => {
    try {
      await createWalletConnectClient();
    } catch (err: unknown) {
      console.log(err);
      alert(err);
    }
  }, []);

  useEffect(() => {
    if (!walletConnectClient) {
      onInitialize();
    }
  }, [walletConnectClient, onInitialize]);
}
