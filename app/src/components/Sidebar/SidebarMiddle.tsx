import { Link } from "@nextui-org/react";
import styles from "./SidebarMiddle.module.css";

export function SidebarMiddle() {
  return (
    <div className={styles.sidebar_middle}>
      <p>Sidebar Middle</p>
      <p>Total Balance</p>
      <p>Navigaton</p>
      <p>
        <Link href="/apps">Vault Apps</Link>
      </p>
      <p>
        <Link href="/v0/welcome">WalletConnect</Link>
      </p>
    </div>
  );
}
