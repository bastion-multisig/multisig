import { AnchorProvider, Program } from "@project-serum/anchor";
import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  GOKI_ADDRESSES,
  SmartWallet,
  SmartWalletData,
  SmartWalletIDL,
} from "@multisig/multisig-tx";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

export interface MultisigContextState {
  provider: AnchorProvider;
  program: Program<SmartWallet>;
  smartWalletPk?: string;
  setSmartWalletPk: (value: string) => void;
  smartWallet?: SmartWalletData;
}

export const MultisigContext = createContext<MultisigContextState>(
  {} as MultisigContextState
);

export function useAutoConnect(): MultisigContextState {
  return useContext(MultisigContext);
}

export const AutoConnectProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [smartWalletPk, setSmartWalletPk] = useState<string>();
  const [smartWallet, setSmartWallet] = useState<SmartWalletData>();

  const { connection } = useConnection();
  const wallet = useWallet();
  const provider = useMemo(
    () =>
      new AnchorProvider(
        connection,
        wallet as any,
        AnchorProvider.defaultOptions()
      ),
    []
  );
  (provider as any).wallet = wallet as any;
  const program = useMemo(
    () => new Program(SmartWalletIDL, GOKI_ADDRESSES.SmartWallet, provider),
    []
  );

  useEffect(() => {
    let abort = false;
    try {
      if (smartWalletPk) {
        program.account.smartWallet
          .fetchNullable(smartWalletPk)
          .then((newSmartWallet) => {
            !abort && setSmartWallet(newSmartWallet ?? undefined);
          });
      }
    } catch {}
    return () => {
      abort = false;
    };
  }, []);

  return (
    <MultisigContext.Provider
      value={{
        provider,
        program,
        smartWalletPk,
        setSmartWalletPk,
        smartWallet,
      }}
    >
      {children}
    </MultisigContext.Provider>
  );
};
