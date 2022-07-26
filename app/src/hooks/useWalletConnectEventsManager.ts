import { useSmartWallet } from "../contexts/SmartWalletContext";
import { SOLANA_SIGNING_METHODS } from "../data/SolanaChains";
import ModalStore from "../store/ModalStore";
import { walletConnectClient } from "../utils/WalletConnectUtil";
import { CLIENT_EVENTS } from "@walletconnect/client";
import { SessionTypes } from "@walletconnect/types";
import { useCallback, useEffect } from "react";
import { approveSolanaRequest } from "../utils/SolanaRequestHandlerUtil";

const AUTO_APPROVE = true;

export default function useWalletConnectEventsManager() {
  const smartWallet = useSmartWallet();

  /******************************************************************************
   * 1. Open session proposal modal for confirmation / rejection
   *****************************************************************************/
  const onSessionProposal = useCallback((proposal: SessionTypes.Proposal) => {
    ModalStore.open("SessionProposalModal", { proposal });
  }, []);

  /******************************************************************************
   * 2. [Optional] handle session created
   *****************************************************************************/
  const onSessionCreated = useCallback((created: SessionTypes.Created) => {},
  []);

  /******************************************************************************
   * 3. Open request handling modal based on method that was used
   *****************************************************************************/
  const onSessionRequest = useCallback(
    async (requestEvent: SessionTypes.RequestEvent) => {
      const { topic, request } = requestEvent;
      const { method } = request;
      const requestSession = await walletConnectClient?.session.get(topic);

      switch (method) {
        case SOLANA_SIGNING_METHODS.SOLANA_SIGN_MESSAGE:
          return ModalStore.open("SessionSignSolanaModal", {
            requestEvent,
            requestSession,
          });

        case SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION:
        case SOLANA_SIGNING_METHODS.SOLANA_SIGN_ALL_TRANSACTIONS:
          if (AUTO_APPROVE) {
            const response = await approveSolanaRequest(
              requestEvent,
              smartWallet
            );
            return await walletConnectClient?.respond({
              topic: requestEvent.topic,
              response,
            });
          } else {
            return ModalStore.open("SessionSignSolanaModal", {
              requestEvent,
              requestSession,
            });
          }
        default:
          return ModalStore.open("SessionUnsuportedMethodModal", {
            requestEvent,
            requestSession,
          });
      }
    },
    [smartWallet, smartWallet.walletPubkey?.toBase58()]
  );

  /******************************************************************************
   * Set up WalletConnect event listeners
   *****************************************************************************/
  useEffect(() => {
    let client = walletConnectClient;
    if (client) {
      client.on(CLIENT_EVENTS.session.proposal, onSessionProposal);

      client.on(CLIENT_EVENTS.session.created, onSessionCreated);

      client.on(CLIENT_EVENTS.session.request, onSessionRequest);
    }
    return () => {
      if (client) {
        client.off(CLIENT_EVENTS.session.proposal, onSessionProposal);

        client.off(CLIENT_EVENTS.session.created, onSessionCreated);

        client.off(CLIENT_EVENTS.session.request, onSessionRequest);
      }
    };
  }, [
    walletConnectClient,
    onSessionProposal,
    onSessionCreated,
    onSessionRequest,
  ]);
}
