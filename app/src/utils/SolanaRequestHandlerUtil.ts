import { SmartWalletContextState } from "../contexts/SmartWalletContext";
import { SOLANA_SIGNING_METHODS } from "../data/SolanaChains";
import { formatJsonRpcError, formatJsonRpcResult } from "@json-rpc-tools/utils";
import { RequestEvent } from "@walletconnect/types";
import { ERROR } from "@walletconnect/utils";
import { isSignTransactionError } from "./error";

/** Signs a solana request using the wallet adapter */
export async function approveSolanaRequest(
  requestEvent: RequestEvent,
  smartWallet: SmartWalletContextState
) {
  const { method, params, id } = requestEvent.request;

  switch (method) {
    case SOLANA_SIGNING_METHODS.SOLANA_SIGN_MESSAGE:
      console.log(
        "SmartWallet program derived addresses can't sign messages.",
        params
      );
      return rejectSolanaRequest(requestEvent.request);

    case SOLANA_SIGNING_METHODS.SOLANA_SIGN_ALL_TRANSACTIONS:
      try {
        const signedParams = await smartWallet.signAllTransactions(params);
        return formatJsonRpcResult(id, signedParams);
      } catch (err: any) {
        console.log(err);
        return rejectSolanaRequest(requestEvent.request);
      }

    case SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION:
      try {
        const signedParams = await smartWallet.signTransaction(params);
        return formatJsonRpcResult(id, signedParams);
      } catch (err: any) {
        console.log(err);
        return rejectSolanaRequest(requestEvent.request);
      }
    default:
      return rejectSolanaRequest(requestEvent.request);
  }
}

/** Rejects the solana request */
export function rejectSolanaRequest(request: RequestEvent["request"]) {
  const { id } = request;

  return formatJsonRpcError(
    id,
    ERROR.JSONRPC_REQUEST_METHOD_REJECTED.format().message
  );
}
