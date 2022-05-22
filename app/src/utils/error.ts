import { TransactionError } from "@solana/web3.js";

export class NoSmartWalletError extends Error {}

export function isNoSmartWalletError(error: any): error is NoSmartWalletError {
  return error instanceof NoSmartWalletError;
}

export class NoWalletError extends Error {}

export function isNoWalletError(error: any): error is NoSmartWalletError {
  return error instanceof NoWalletError;
}

export class SendTransactionError extends Error {
  txError: TransactionError | undefined;
  txId: string;
  constructor(message: string, txId: string, txError?: TransactionError) {
    super(message);

    this.txError = txError;
    this.txId = txId;
  }
}

export function isSendTransactionError(
  error: any
): error is SendTransactionError {
  return error instanceof SendTransactionError;
}

export class SignTransactionError extends Error {}

export function isSignTransactionError(
  error: any
): error is SignTransactionError {
  return error instanceof SignTransactionError;
}

export class TransactionTimeoutError extends Error {
  txId: string;
  constructor(txId: string) {
    super(`Transaction has timed out`);

    this.txId = txId;
  }
}

export function isTransactionTimeoutError(
  error: any
): error is TransactionTimeoutError {
  return error instanceof TransactionTimeoutError;
}
