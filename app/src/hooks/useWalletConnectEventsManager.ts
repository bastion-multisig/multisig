import { useSmartWallet } from "@/contexts/SmartWalletContext";
import { SOLANA_SIGNING_METHODS } from "@/data/SolanaData";
import ModalStore from "@/store/ModalStore";
import { interpretSolanaRequest } from "@/utils/SolanaRequestHandlerUtil";
import { walletConnectClient } from "@/utils/WalletConnectUtil";
import { CLIENT_EVENTS } from "@walletconnect/client";
import { SessionTypes } from "@walletconnect/types";
import { useCallback, useEffect } from "react";

export default function useWalletConnectEventsManager(initialized: boolean) {
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
      const requestSession = await walletConnectClient.session.get(topic);

      switch (method) {
        case SOLANA_SIGNING_METHODS.SOLANA_SIGN_MESSAGE:
          return ModalStore.open("SessionSignSolanaModal", {
            requestEvent,
            requestSession,
          });

        case SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION:
          // Interpret the transaction as multisig before passing it on
          const interpreted = await interpretSolanaRequest(
            requestEvent,
            smartWallet
          );

          return ModalStore.open("SessionSignSolanaModal", {
            requestEvent,
            requestSession,
            interpreted,
          });

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
    if (initialized) {
      walletConnectClient.on(CLIENT_EVENTS.session.proposal, onSessionProposal);

      walletConnectClient.on(CLIENT_EVENTS.session.created, onSessionCreated);

      walletConnectClient.on(CLIENT_EVENTS.session.request, onSessionRequest);
    }
  }, [initialized, onSessionProposal, onSessionCreated, onSessionRequest]);
}
