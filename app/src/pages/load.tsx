import PageHeader from "@/components/PageHeader";
import { Button, Card, Collapse, Divider, Text } from "@nextui-org/react";
import { useState } from "react";

export default function CreatePage() {
  const [current, setCurrent] = useState(0);

  function back() {
    setCurrent((current) => Math.max(current - 1, 0));
  }
  function next() {
    setCurrent((current) => Math.min(current + 1, 3));
  }
  return (
    <>
      <PageHeader title="Load Smart Wallet" />
      <Text>Coming soon</Text>
    </>
  );
}
