import { GOKI_ADDRESSES } from "@multisig/multisig-tx";
import {
  IDL as SmartWalletIdl,
  SmartWallet,
} from "@multisig/multisig-tx/lib/idl/smart_wallet";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { createContext, FC, ReactNode, useContext, useMemo } from "react";

export interface SmartWalletContextState {
  program: Program<SmartWallet>;
}

export const SmartWalletContext = createContext<SmartWalletContextState>(
  {} as SmartWalletContextState
);

export function useSmartWallet() {
  return useContext(SmartWalletContext).program;
}

export const SmartWalletProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { connection } = useConnection();
  const wallet = useWallet();
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

  return (
    <SmartWalletContext.Provider value={{ program }}>
      {children}
    </SmartWalletContext.Provider>
  );
};
