import ProjectInfoCard from "@/components/ProjectInfoCard";
import RequesDetailsCard from "@/components/RequestDetalilsCard";
import RequestMethodCard from "@/components/RequestMethodCard";
import RequestModalContainer from "@/components/RequestModalContainer";
import { useSmartWallet } from "@/contexts/SmartWalletContext";
import ModalStore from "@/store/ModalStore";
import { walletConnectClient } from "@/utils/WalletConnectUtil";
import { Button, Divider, Modal, Text } from "@nextui-org/react";

export default function SessionProposalModal() {
  const { treasuryPk } = useSmartWallet();

  // Get proposal data and wallet address from store
  const proposal = ModalStore.state.data?.proposal;

  // Ensure proposal is defined
  if (!proposal) {
    return <Text>Missing proposal data</Text>;
  }

  // Get required proposal data
  const { proposer, permissions, relay } = proposal;
  const { chains } = permissions.blockchain;
  const { methods } = permissions.jsonrpc;

  // Handle approve action
  async function onApprove() {
    if (proposal && treasuryPk) {
      // This connects to any cluster that the frontend requests
      // Chain consts are available in src/data/SolanaData.ts

      // FIXME! This may cause a problem when connecting to a
      // cluster where the smart wallet does not exist.
      // Check if the smart wallet exists on the chain before continuing
      const accounts = chains.map(
        (chain) => `${chain}:${treasuryPk.toBase58()}`
      );
      const response = {
        state: {
          accounts,
        },
      };
      await walletConnectClient.approve({ proposal, response });
    }
    ModalStore.close();
  }

  // Hanlde reject action
  async function onReject() {
    if (proposal) {
      await walletConnectClient.reject({ proposal });
    }
    ModalStore.close();
  }

  return (
    <>
      <RequestModalContainer title="Session Proposal">
        <ProjectInfoCard metadata={proposer.metadata} />

        <Divider y={2} />

        <RequesDetailsCard chains={chains} protocol={relay.protocol} />

        <Divider y={2} />

        <RequestMethodCard methods={methods} />
      </RequestModalContainer>

      <Modal.Footer>
        <Button auto flat color="error" onClick={onReject}>
          {treasuryPk ? "Reject" : "Smart Wallet not connected"}
        </Button>

        {treasuryPk && (
          <Button auto flat color="success" onClick={onApprove}>
            Approve
          </Button>
        )}
      </Modal.Footer>
    </>
  );
}
