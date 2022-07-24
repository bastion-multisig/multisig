import LayoutV0 from "../../components/V0/LayoutV0";
import PageHeaderV0 from "../../components/V0/PageHeaderV0";
import { Text } from "@nextui-org/react";
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
    <LayoutV0>
      <PageHeaderV0 title="Load Smart Wallet" />
      <Text>Coming soon</Text>
    </LayoutV0>
  );
}
