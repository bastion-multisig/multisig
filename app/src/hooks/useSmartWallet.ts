import { useSmartWallet } from "../contexts/SmartWalletContext";

export function useSmartWalletOwnerIndex() {
  const { walletPubkey, smartWallet } = useSmartWallet();
  if (!walletPubkey || !smartWallet) {
    return -1;
  }
  return smartWallet.owners.findIndex((owner) => owner.equals(walletPubkey));
}

export function useIsSmartWalletReadonly() {
  return useSmartWalletOwnerIndex() === -1;
}
