import {
  NoSmartWalletError,
  NoWalletError,
  SignTransactionError,
} from "@/utils/error";
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
import { deserialiseTransaction, SolanaSignTransaction } from "solana-wallet";

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
  signTransaction: (params: SolanaSignTransaction) => Promise<{
    signature: string;
  }>;
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
    if (
      !wallet ||
      !walletPubkey ||
      !wallet.signMessage ||
      !wallet.signAllTransactions
    ) {
      throw new NoWalletError();
    }

    const signedMessage = await wallet.signMessage(bs58.decode(message));
    return { signature: bs58.encode(signedMessage) };
  }

  async function signTransaction(params: SolanaSignTransaction) {
    if (
      !wallet ||
      !walletPubkey ||
      !wallet.signMessage ||
      !wallet.signAllTransactions
    ) {
      throw new NoWalletError();
    }
    if (!smartWalletPk) {
      throw new NoSmartWalletError();
    }
    const smartWalletAddress = translateAddress(smartWalletPk);

    // Hack to fix array being undefined in `deserializeTransaction`
    // Delete this line when this is merged https://github.com/WalletConnect/solana-wallet/pull/1
    params.partialSignatures ??= [];

    // Interpret the solana request as a multisig transaction before passing it on
    const transaction = deserialiseTransaction(params);
    const { interpreted, txPubkeys } = await TxInterpreter.multisig(
      program,
      smartWalletAddress,
      walletPubkey,
      transaction
    );

    // Sign
    const signedTransaction = await wallet.signAllTransactions(interpreted);

    // Go fishing for the signature
    const result = signedTransaction[0].signatures.find((sig) =>
      sig.publicKey.equals(walletPubkey)
    );

    if (!result || !result.signature) {
      throw new SignTransactionError();
    }
    return { signature: bs58.encode(result.signature) };
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
        signTransaction,
      }}
    >
      {children}
    </SmartWalletContext.Provider>
  );
};
