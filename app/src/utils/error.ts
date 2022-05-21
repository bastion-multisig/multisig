export class NoSmartWalletError extends Error {}

export function isNoSmartWalletError(error: any): error is NoSmartWalletError {
  return error instanceof NoSmartWalletError;
}
