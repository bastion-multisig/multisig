import { SOLANA_SIGNING_METHODS } from "../constants/SolanaData";
import { CLIENT_EVENTS } from "@walletconnect/client";
import { SessionTypes } from "@walletconnect/types";
import { useCallback, useEffect } from "react";
import { notify } from "utils/notifications";
import { approveSolanaRequest } from "utils/SolanaRequestHandlerUtil";
import { useWalletConnect } from "contexts/WalletConnectProvider";
import { useWallet } from "@solana/wallet-adapter-react";

export default function useWalletConnectEventsManager(initialized: boolean) {
  const wallet = useWallet();
  const { walletConnectClient } = useWalletConnect();

  /******************************************************************************
   * 1. Open session proposal modal for confirmation / rejection
   *****************************************************************************/
  const onSessionProposal = useCallback((proposal: SessionTypes.Proposal) => {
    // ModalStore.open("SessionProposalModal", { proposal });
  }, []);

  /******************************************************************************
   * 2. [Optional] hanle session created
   *****************************************************************************/
  const onSessionCreated = useCallback((created: SessionTypes.Created) => {},
  []);

  /******************************************************************************
   * 3. Open request handling modal based on method that was used
   *****************************************************************************/
  const onSessionRequest = useCallback(
    async (requestEvent: SessionTypes.RequestEvent) => {
      if (walletConnectClient === undefined) {
        return;
      }

      const { topic, request } = requestEvent;
      const { method } = request;
      const requestSession = await walletConnectClient.session.get(topic);

      switch (method) {
        case SOLANA_SIGNING_METHODS.SOLANA_SIGN_MESSAGE:
        case SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION:
          notify({
            type: "success",
            message: "Sign transaction PLEASE :)",
          });
          const response = await approveSolanaRequest(requestEvent, wallet);
          await walletConnectClient.respond({
            topic,
            response,
          });

        default:
          notify({
            type: "warning",
            message: "Action unsupported",
          });
        // return ModalStore.open("SessionUnsuportedMethodModal", {
        //   requestEvent,
        //   requestSession,
        // });
      }
    },
    []
  );

  /******************************************************************************
   * Set up WalletConnect event listeners
   *****************************************************************************/
  useEffect(() => {
    if (walletConnectClient) {
      walletConnectClient.on(CLIENT_EVENTS.session.proposal, onSessionProposal);

      walletConnectClient.on(CLIENT_EVENTS.session.created, onSessionCreated);

      walletConnectClient.on(CLIENT_EVENTS.session.request, onSessionRequest);
    }
  }, [walletConnectClient]);
}
