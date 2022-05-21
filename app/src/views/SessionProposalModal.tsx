import ProjectInfoCard from "@/components/ProjectInfoCard";
import RequesDetailsCard from "@/components/RequestDetalilsCard";
import RequestMethodCard from "@/components/RequestMethodCard";
import RequestModalContainer from "@/components/RequestModalContainer";
import { useSmartWallet } from "@/contexts/SmartWalletContext";
import { SOLANA_MAINNET_CHAINS } from "@/data/SolanaData";
import ModalStore from "@/store/ModalStore";
import { walletConnectClient } from "@/utils/WalletConnectUtil";
import { Button, Divider, Modal, Text } from "@nextui-org/react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useCallback } from "react";

export default function SessionProposalModal() {
  const { walletPubkey } = useSmartWallet();

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
    if (proposal) {
      const accounts = walletPubkey
        ? [
            `solana:${
              SOLANA_MAINNET_CHAINS["solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ"]
                .chainId
            }:${walletPubkey.toBase58()}`,
          ]
        : [];
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
          {walletPubkey ? "Reject" : "Wallet not connected"}
        </Button>

        {walletPubkey && (
          <Button auto flat color="success" onClick={onApprove}>
            Approve
          </Button>
        )}
      </Modal.Footer>
    </>
  );
}
