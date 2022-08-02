import { Link } from "@nextui-org/react";
import styles from "./SidebarMiddle.module.css";

export function SidebarMiddle() {
  return (
    <div className={styles.sidebar_middle}>
      <p>Total Balance</p>
      <p>Navigation</p>
      <p>
        <Link href="/v0/welcome">WalletConnect</Link>
      </p>
    </div>
  );
}
