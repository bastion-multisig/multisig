import { GOKI_ADDRESSES, SmartWalletData } from "@multisig/multisig-tx";
import {
  IDL as SmartWalletIdl,
  SmartWallet,
} from "@multisig/multisig-tx/lib/idl/smart_wallet";
import { AnchorProvider, Program } from "@project-serum/anchor";
import {
  useConnection,
  useWallet,
  WalletContextState,
} from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface SmartWalletContextState {
  connection: Connection;
  wallet: WalletContextState;
  walletPubkey: PublicKey | null;
  provider: AnchorProvider;
  program: Program<SmartWallet>;
  smartWalletPk?: string;
  setSmartWalletPk: (value: string) => void;
  smartWallet?: SmartWalletData;
}

export const SmartWalletContext = createContext<SmartWalletContextState>(
  {} as SmartWalletContextState
);

export function useSmartWallet() {
  return useContext(SmartWalletContext);
}

export const SmartWalletProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey } = wallet;
  const [smartWalletPk, setSmartWalletPk] = useState<string>();
  const [smartWallet, setSmartWallet] = useState<SmartWalletData>();

  const provider = useMemo(() => {
    return new AnchorProvider(connection, wallet as any, {
      skipPreflight: true,
    });
  }, [connection]);
  (provider as any).wallet = wallet;

  const program = useMemo(() => {
    return new Program<SmartWallet>(
      SmartWalletIdl,
      GOKI_ADDRESSES.SmartWallet,
      provider
    );
  }, [SmartWalletIdl, GOKI_ADDRESSES.SmartWallet, provider]);

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
      abort = true;
    };
  }, []);

  return (
    <SmartWalletContext.Provider
      value={{
        connection,
        wallet,
        walletPubkey: publicKey,
        provider,
        program,
        smartWalletPk,
        setSmartWalletPk,
        smartWallet,
      }}
    >
      {children}
    </SmartWalletContext.Provider>
  );
};
