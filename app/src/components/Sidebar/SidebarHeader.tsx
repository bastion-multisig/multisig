import { useSmartWallet } from "../../contexts/SmartWalletContext";
import { shortenAddress } from "../../utils/solana";
import styles from "./SidebarHeader.module.css";

export function SidebarHeader() {
  const { smartWalletPk } = useSmartWallet();
  return (
    <div className={styles.sidebar_header}>
      <p>My Vault</p>
      <p>
        {smartWalletPk
          ? shortenAddress(smartWalletPk)
          : "Not Connected To Vault"}
      </p>
    </div>
  );
}
