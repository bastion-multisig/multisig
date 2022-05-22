import { BN, utils } from "@project-serum/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { PublicKey } from "@solana/web3.js";

export const findSmartWallet = (base: PublicKey): [PublicKey, number] => {
  return findProgramAddressSync(
    [utils.bytes.utf8.encode("GokiSmartWallet"), base.toBuffer()],
    GOKI_ADDRESSES.SmartWallet
  );
};

export const findTransactionAddress = (
  smartWallet: PublicKey,
  index: number
): [PublicKey, number] => {
  return findProgramAddressSync(
    [
      utils.bytes.utf8.encode("GokiTransaction"),
      smartWallet.toBuffer(),
      new BN(index).toArrayLike(Buffer, "le", 8),
    ],
    GOKI_ADDRESSES.SmartWallet
  );
};

/**
 * Finds a derived address of a Smart Wallet.
 * @param smartWallet
 * @param index
 * @returns
 */
export const findWalletDerivedAddress = (
  smartWallet: PublicKey,
  index: number
): [PublicKey, number] => {
  return findProgramAddressSync(
    [
      utils.bytes.utf8.encode("GokiSmartWalletDerived"),
      smartWallet.toBuffer(),
      new BN(index).toArrayLike(Buffer, "le", 8),
    ],
    GOKI_ADDRESSES.SmartWallet
  );
};

/**
 * Finds an Owner Invoker address of a Smart Wallet.
 * @param smartWallet
 * @param index
 * @returns
 */
export const findOwnerInvokerAddress = (
  smartWallet: PublicKey,
  index: number
): [PublicKey, number] => {
  return findProgramAddressSync(
    [
      utils.bytes.utf8.encode("GokiSmartWalletOwnerInvoker"),
      smartWallet.toBuffer(),
      new BN(index).toArrayLike(Buffer, "le", 8),
    ],
    GOKI_ADDRESSES.SmartWallet
  );
};

/**
 * Finds the subaccount info address of a subaccount of a smart wallet.
 * @param subaccount
 * @returns
 */
export const findSubaccountInfoAddress = (
  subaccount: PublicKey
): [PublicKey, number] => {
  return findProgramAddressSync(
    [utils.bytes.utf8.encode("GokiSubaccountInfo"), subaccount.toBuffer()],
    GOKI_ADDRESSES.SmartWallet
  );
};

/**
 * Finds a derived address of a Smart Wallet.
 * @param smartWallet
 * @param index
 * @returns
 */
export const findWalletPartialSignerAddress = (
  smartWallet: PublicKey,
  index: BN
): [PublicKey, number] => {
  return findProgramAddressSync(
    [
      utils.bytes.utf8.encode("GokiSmartWalletPartialSigner"),
      smartWallet.toBuffer(),
      index.toArrayLike(Buffer, "le", 8),
    ],
    GOKI_ADDRESSES.SmartWallet
  );
};

export const GOKI_ADDRESSES = {
  SmartWallet: new PublicKey("GokivDYuQXPZCWRkwMhdH2h91KpDQXBEmpgBgs55bnpH"),
  TokenSigner: new PublicKey("NFTUJzSHuUCsMMqMRJpB7PmbsaU7Wm51acdPk2FXMLn"),
};
