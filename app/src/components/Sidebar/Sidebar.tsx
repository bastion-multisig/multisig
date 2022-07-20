import { Layout } from "antd";
import styles from "./Sidebar.module.css";
import { SidebarBottom } from "./SidebarBottom";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarMiddle } from "./SidebarMiddle";
const { Header, Footer, Sider, Content } = Layout;

export function Sidebar() {
  return (
    <div className={styles.sidebar}>
      <SidebarHeader />
      <SidebarMiddle />
      <SidebarBottom />
    </div>
  );
}
