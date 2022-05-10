import { BN, utils } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

export const findSmartWallet = async (
  base: PublicKey
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [utils.bytes.utf8.encode("GokiSmartWallet"), base.toBuffer()],
    GOKI_ADDRESSES.SmartWallet
  );
};

export const findTransactionAddress = async (
  smartWallet: PublicKey,
  index: number
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
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
export const findWalletDerivedAddress = async (
  smartWallet: PublicKey,
  index: number
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
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
export const findOwnerInvokerAddress = async (
  smartWallet: PublicKey,
  index: number
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
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
export const findSubaccountInfoAddress = async (
  subaccount: PublicKey
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
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
export const findWalletPartialSignerAddress = async (
  smartWallet: PublicKey,
  index: BN
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
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
