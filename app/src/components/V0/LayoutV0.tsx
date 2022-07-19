import RouteTransitionV0 from "@/components/V0/RouteTransitionV0";
import {
  Card,
  Container,
  createTheme,
  NextUIProvider,
} from "@nextui-org/react";
import { ReactNode } from "react";
import NavigationV0 from "./NavigationV0";

let theme = createTheme({ type: "dark" });

/**
 * Container
 */
export default function LayoutV0({
  children,
}: {
  children: ReactNode | ReactNode[];
}) {
  return (
    <NextUIProvider theme={theme}>
      <Container
        display="flex"
        justify="center"
        alignItems="center"
        css={{
          width: "100vw",
          height: "100vh",
          paddingLeft: 0,
          paddingRight: 0,
        }}
      >
        <Card
          bordered={{ "@initial": false, "@xs": true }}
          borderWeight={{ "@initial": "light", "@xs": "light" }}
          css={{
            height: "100vh",
            width: "100%",
            borderRadius: 0,
            paddingBottom: 5,
            "@xs": {
              borderRadius: "$lg",
              height: "95vh",
              maxWidth: "450px",
            },
          }}
        >
          <RouteTransitionV0>
            <Card.Body
              css={{
                paddingLeft: 2,
                paddingRight: 2,
                "@xs": {
                  padding: "20px",
                  paddingBottom: "40px",
                },
              }}
            >
              {children}
            </Card.Body>
          </RouteTransitionV0>

          <Card.Footer
            css={{
              height: "85px",
              minHeight: "85px",
              position: "sticky",
              justifyContent: "flex-end",
              alignItems: "flex-end",
              boxShadow: "0 -30px 20px #111111",
              zIndex: 200,
              bottom: 0,
              left: 0,
            }}
          >
            <NavigationV0 />
          </Card.Footer>
        </Card>
      </Container>
    </NextUIProvider>
  );
}
