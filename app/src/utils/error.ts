import {
  WalletSendTransactionError,
  WalletSignMessageError,
  WalletSignTransactionError,
} from "@solana/wallet-adapter-base";

export class NoSmartWalletError extends Error {}

export function isNoSmartWalletError(error: any): error is NoSmartWalletError {
  return error instanceof NoSmartWalletError;
}

export class NoWalletError extends Error {}

export function isNoWalletError(error: any): error is NoSmartWalletError {
  return error instanceof NoWalletError;
}

export function isSendTransactionError(
  error: any
): error is WalletSendTransactionError {
  return error instanceof WalletSendTransactionError;
}

export function isSignTransactionError(
  error: any
): error is WalletSignTransactionError {
  return error instanceof WalletSignTransactionError;
}

export function isSignMessageError(
  error: any
): error is WalletSignMessageError {
  return error instanceof WalletSignMessageError;
}
