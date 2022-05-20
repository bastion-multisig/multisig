import { useSmartWallet } from "@/contexts/SmartWalletContext";
import { SmartWallet } from "@multisig/multisig-tx";
import { AnchorProvider, Program } from "@project-serum/anchor";
import {
  useConnection,
  useWallet,
  WalletContextState,
} from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";

export interface RpcContext {
  endpoint: string;
  connection: Connection;
  wallet: WalletContextState;
  walletPubkey: PublicKey | null;
  provider: AnchorProvider;
  program: Program<SmartWallet>;
}

export function useRpcContext(): RpcContext {
  const { connection } = useConnection();
  const wallet = useWallet();
  const program = useSmartWallet();
  return {
    endpoint: connection.rpcEndpoint,
    connection,
    wallet,
    walletPubkey: wallet.publicKey,
    provider: program.provider as AnchorProvider,
    program,
  };
}
