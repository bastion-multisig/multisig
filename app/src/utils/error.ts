export class NoSmartWalletError extends Error {}

export function isNoSmartWalletError(error: any): error is NoSmartWalletError {
  return error instanceof NoSmartWalletError;
}

export class NoWalletError extends Error {}

export function isNoWalletError(error: any): error is NoSmartWalletError {
  return error instanceof NoWalletError;
}
