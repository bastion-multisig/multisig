import { NoSmartWalletError, NoWalletError } from "@/utils/error";
import {
  findWalletDerivedAddress,
  GOKI_ADDRESSES,
  SmartWalletData,
  TxInterpreter,
} from "@multisig/multisig-tx";
import {
  IDL as SmartWalletIdl,
  SmartWallet,
} from "@multisig/multisig-tx/lib/idl/smart_wallet";
import {
  AnchorProvider,
  Program,
  translateAddress,
} from "@project-serum/anchor";
import { WalletSignTransactionError } from "@solana/wallet-adapter-base";
import {
  useConnection,
  useLocalStorage,
  useWallet,
  WalletContextState,
} from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import bs58 from "bs58";
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
  deserialiseTransaction,
  deserializeAllTransactions,
  serialiseTransaction,
  serializeAllTransactions,
  SolanaSignAllTransactions,
  SolanaSignTransaction,
} from "solana-wallet";

export interface SmartWalletContextState {
  connection: Connection;
  wallet: WalletContextState;
  walletPubkey: PublicKey | null;
  provider: AnchorProvider;
  program: Program<SmartWallet>;
  smartWalletPk?: string;
  setSmartWalletPk: (value: string) => void;
  smartWallet?: SmartWalletData;
  treasuryPk?: PublicKey;
  signMessage: (message: string) => Promise<{
    signature: string;
  }>;
  signAllTransactions: (
    params: SolanaSignAllTransactions
  ) => Promise<SolanaSignAllTransactions>;
  signTransaction: (
    params: SolanaSignTransaction
  ) => Promise<SolanaSignTransaction>;
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
  const { publicKey: walletPubkey } = wallet;
  const [smartWalletPk, setSmartWalletPk] = useLocalStorage<string | undefined>(
    "smart-wallet",
    undefined
  );
  const [smartWallet, setSmartWallet] = useState<SmartWalletData>();
  const [treasuryPk, setTreasuryPk] = useState<PublicKey>();

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

  // FIXME! use react query and also load tokens for treasury
  useEffect(() => {
    let abort = false;
    try {
      if (smartWalletPk) {
        let smartWalletAddress = translateAddress(smartWalletPk);
        program.account.smartWallet
          .fetchNullable(smartWalletPk)
          .then((newSmartWallet) => {
            if (!abort) {
              setSmartWallet(newSmartWallet ?? undefined);
              const [treasuryPk] = findWalletDerivedAddress(
                smartWalletAddress,
                0
              );
              setTreasuryPk(treasuryPk);
            }
          });
      }
    } catch {}
    return () => {
      abort = true;
    };
  }, []);

  async function signMessage(message: string) {
    if (!wallet || !walletPubkey || !wallet.signMessage) {
      throw new NoWalletError();
    }

    const signedMessage = await wallet.signMessage(bs58.decode(message));
    return { signature: bs58.encode(signedMessage) };
  }

  async function signAllTransactions(params: SolanaSignAllTransactions) {
    if (!wallet || !walletPubkey || !wallet.signAllTransactions) {
      throw new NoWalletError();
    }
    if (!smartWalletPk) {
      throw new NoSmartWalletError();
    }
    const smartWalletAddress = translateAddress(smartWalletPk);

    // Interpret the solana request as a multisig transaction before passing it on
    const transactions = deserializeAllTransactions(params);
    const { interpreted, txPubkeys } = await TxInterpreter.multisig(
      program,
      smartWalletAddress,
      walletPubkey,
      ...transactions
    );

    // Sign
    const signedTransactions = await wallet.signAllTransactions(interpreted);

    return serializeAllTransactions(signedTransactions);
  }

  async function signTransaction(params: SolanaSignTransaction) {
    if (!wallet || !walletPubkey || !wallet.signTransaction) {
      throw new NoWalletError();
    }
    if (!smartWalletPk) {
      throw new NoSmartWalletError();
    }
    const smartWalletAddress = translateAddress(smartWalletPk);

    // Interpret the solana request as a multisig transaction before passing it on
    const transaction = deserialiseTransaction(params);
    const { interpreted, txPubkeys } = await TxInterpreter.multisig(
      program,
      smartWalletAddress,
      walletPubkey,
      transaction
    );

    if (interpreted.length === 0) {
      throw new WalletSignTransactionError(
        "Interpreting one transaction as multisig and got none back."
      );
    }
    if (interpreted.length > 1) {
      throw new WalletSignTransactionError(
        "Interpreting one transacton as multisig and got many back."
      );
    }

    // Sign
    const signedTransaction = await wallet.signTransaction(interpreted[0]);

    return serialiseTransaction(signedTransaction);
  }

  return (
    <SmartWalletContext.Provider
      value={{
        connection,
        wallet,
        walletPubkey,
        provider,
        program,
        smartWalletPk,
        setSmartWalletPk,
        smartWallet,
        treasuryPk,
        signMessage,
        signAllTransactions,
        signTransaction,
      }}
    >
      {children}
    </SmartWalletContext.Provider>
  );
};
