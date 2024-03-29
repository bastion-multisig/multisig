import { Col, Divider, Row, Text } from "@nextui-org/react";
import { ReactNode } from "react";

/**
 * Types
 */
interface Props {
  children?: ReactNode | ReactNode[];
  title: string;
}

/**
 * Component
 */
export default function PageHeaderV0({ title, children }: Props) {
  return (
    <>
      <Row
        css={{ marginBottom: "$5", width: "100%" }}
        justify="space-between"
        align="center"
      >
        <Col>
          <Text
            h3
            weight="bold"
            css={{
              textGradient: "90deg, $secondary, $primary 30%",
            }}
          >
            {title}
          </Text>
        </Col>
        {children ? <Col css={{ flex: 1 }}>{children}</Col> : null}
      </Row>

      <Divider css={{ marginBottom: "$10" }} />
    </>
  );
}
