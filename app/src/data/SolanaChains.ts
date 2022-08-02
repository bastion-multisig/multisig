import BN from "bn.js";

/**
 * Types
 */
export type TSolanaChain = keyof typeof SOLANA_CHAINS;

export const SOLANA_CHAINS = {
  "solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ": {
    chainId: "4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ",
    name: "Solana",
    logo: "/chain-logos/solana-4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ.png",
    rgb: "30, 240, 166",
    rpc: "",
  },
  "solana:8E9rvCKLFQia2Y35HXjjpWzj8weVo44K": {
    chainId: "8E9rvCKLFQia2Y35HXjjpWzj8weVo44K",
    name: "Solana Devnet",
    logo: "/chain-logos/solana-4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ.png",
    rgb: "30, 240, 166",
    rpc: "",
  },
};

/**
 * Methods
 */
export const SOLANA_SIGNING_METHODS = {
  SOLANA_SIGN_ALL_TRANSACTIONS: "solana_signAllTransactions",
  SOLANA_SIGN_TRANSACTION: "solana_signTransaction",
  SOLANA_SIGN_MESSAGE: "solana_signMessage",
};

export const DEFAULT_WALLET_DERIVED_INDEX = new BN(0);
export const NO_ETA = new BN(-1);
export const NOT_EXECUTED = new BN(-1);
