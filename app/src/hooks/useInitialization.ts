import { createWalletConnectClient } from "@/utils/WalletConnectUtil";
import { useCallback, useEffect, useState } from "react";

export default function useInitialization() {
  const [initialized, setInitialized] = useState(false);

  const onInitialize = useCallback(async () => {
    try {
      await createWalletConnectClient();

      setInitialized(true);
    } catch (err: unknown) {
      console.log(err);
      alert(err);
    }
  }, []);

  useEffect(() => {
    if (!initialized) {
      onInitialize();
    }
  }, [initialized, onInitialize]);

  return initialized;
}
