import QrReader from "../../components/QrReader";
import LayoutV0 from "../../components/V0/LayoutV0";
import PageHeaderV0 from "../../components/V0/PageHeaderV0";
import { walletConnectClient } from "../../utils/WalletConnectUtil";
import { Button, Input, Loading, Text } from "@nextui-org/react";
import { useState } from "react";

export default function WalletConnectPage() {
  const [uri, setUri] = useState("");
  const [loading, setLoading] = useState(false);

  async function onConnect(uri: string) {
    try {
      setLoading(true);
      await walletConnectClient?.pair({ uri });
    } catch (err: unknown) {
      console.log(err);
      alert(err);
    } finally {
      setUri("");
      setLoading(false);
    }
  }

  return (
    <LayoutV0>
      <PageHeaderV0 title="WalletConnect" />

      {walletConnectClient ? (
        <>
          <QrReader onConnect={onConnect} />

          <Text
            size={13}
            css={{ textAlign: "center", marginTop: "$10", marginBottom: "$10" }}
          >
            or use walletconnect uri
          </Text>

          <Input
            bordered
            aria-label="wc url connect input"
            placeholder="e.g. wc:a281567bb3e4..."
            onChange={(e) => setUri(e.target.value)}
            value={uri}
            contentRight={
              <Button
                size="xs"
                disabled={!uri}
                css={{ marginLeft: -60 }}
                onClick={() => onConnect(uri)}
                color="gradient"
              >
                {loading ? <Loading size="sm" /> : "Connect"}
              </Button>
            }
          />

          <Text
            size={13}
            css={{ textAlign: "center", marginTop: "$10", marginBottom: "$10" }}
          >
            <a href="https://react-app.walletconnect.com/" target={"_blank"}>
              Go to a dApp with WalletConnect
            </a>
          </Text>
        </>
      ) : (
        "Connecting to Walletconnect"
      )}
    </LayoutV0>
  );
}
