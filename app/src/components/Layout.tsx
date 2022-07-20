import { Layout as AntdLayout } from "antd";
import React, { ReactNode } from "react";
import { Sidebar } from "./Sidebar/Sidebar";

const { Header, Footer, Sider, Content } = AntdLayout;

export function Layout({ children }: { children: ReactNode | ReactNode[] }) {
  return (
    <AntdLayout
      style={{
        backgroundColor: "#F0F0F0",
        display: "flex",
        flexDirection: "row",
      }}
    >
      <Sidebar />
      <Content>{children}</Content>
    </AntdLayout>
  );
}
