import ProjectInfoCard from "@/components/ProjectInfoCard";
import RequestDataCard from "@/components/RequestDataCard";
import RequesDetailsCard from "@/components/RequestDetalilsCard";
import RequestMethodCard from "@/components/RequestMethodCard";
import RequestModalContainer from "@/components/RequestModalContainer";
import ModalStore from "@/store/ModalStore";
import {
  approveEIP155Request,
  rejectEIP155Request,
} from "@/utils/EIP155RequestHandlerUtil";
import { getSignTypedDataParamsData } from "@/utils/HelperUtil";
import { walletConnectClient } from "@/utils/WalletConnectUtil";
import { Button, Divider, Modal, Text } from "@nextui-org/react";

export default function SessionSignTypedDataModal() {
  // Get request and wallet data from store
  const requestEvent = ModalStore.state.data?.requestEvent;
  const requestSession = ModalStore.state.data?.requestSession;

  // Ensure request and wallet are defined
  if (!requestEvent || !requestSession) {
    return <Text>Missing request data</Text>;
  }

  // Get required request data
  const { method, params } = requestEvent.request;

  // Get data
  const data = getSignTypedDataParamsData(params);

  // Handle approve action (logic varies based on request method)
  async function onApprove() {
    if (requestEvent) {
      const response = await approveEIP155Request(requestEvent);
      await walletConnectClient.respond({
        topic: requestEvent.topic,
        response,
      });
      ModalStore.close();
    }
  }

  // Handle reject action
  async function onReject() {
    if (requestEvent) {
      const response = rejectEIP155Request(requestEvent.request);
      await walletConnectClient.respond({
        topic: requestEvent.topic,
        response,
      });
      ModalStore.close();
    }
  }

  return (
    <>
      <RequestModalContainer title="Sign Typed Data">
        <ProjectInfoCard metadata={requestSession.peer.metadata} />

        <Divider y={2} />

        <RequesDetailsCard
          chains={[requestEvent.chainId ?? ""]}
          protocol={requestSession.relay.protocol}
        />

        <Divider y={2} />

        <RequestDataCard data={data} />

        <Divider y={2} />

        <RequestMethodCard methods={[method]} />
      </RequestModalContainer>

      <Modal.Footer>
        <Button auto flat color="error" onClick={onReject}>
          Reject
        </Button>
        <Button auto flat color="success" onClick={onApprove}>
          Approve
        </Button>
      </Modal.Footer>
    </>
  );
}
