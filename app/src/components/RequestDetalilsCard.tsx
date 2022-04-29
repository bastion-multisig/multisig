import { COSMOS_MAINNET_CHAINS, TCosmosChain } from "@/data/COSMOSData";
import { EIP155_CHAINS, TEIP155Chain } from "@/data/EIP155Data";
import { SOLANA_CHAINS, TSolanaChain } from "@/data/SolanaData";
import { Col, Divider, Row, Text } from "@nextui-org/react";

/**
 * Types
 */
interface IProps {
  chains: string[];
  protocol: string;
}

/**
 * Component
 */
export default function RequesDetailsCard({ chains, protocol }: IProps) {
  return (
    <>
      <Row>
        <Col>
          <Text h5>Blockchain(s)</Text>
          <Text color="$gray400">
            {chains
              .map(
                (chain) =>
                  EIP155_CHAINS[chain as TEIP155Chain]?.name ??
                  COSMOS_MAINNET_CHAINS[chain as TCosmosChain]?.name ??
                  SOLANA_CHAINS[chain as TSolanaChain]?.name ??
                  chain
              )
              .join(", ")}
          </Text>
        </Col>
      </Row>

      <Divider y={2} />

      <Row>
        <Col>
          <Text h5>Relay Protocol</Text>
          <Text color="$gray400">{protocol}</Text>
        </Col>
      </Row>
    </>
  );
}
