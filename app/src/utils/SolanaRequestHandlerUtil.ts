import { SmartWalletContextState } from "@/contexts/SmartWalletContext";
import { SOLANA_SIGNING_METHODS } from "@/data/SolanaChains";
import { formatJsonRpcError, formatJsonRpcResult } from "@json-rpc-tools/utils";
import { RequestEvent } from "@walletconnect/types";
import { ERROR } from "@walletconnect/utils";
import { isSignMessageError, isSignTransactionError } from "./error";

/** Signs a solana request using the wallet adapter */
export async function approveSolanaRequest(
  requestEvent: RequestEvent,
  smartWallet: SmartWalletContextState
) {
  const { method, params, id } = requestEvent.request;

  switch (method) {
    case SOLANA_SIGNING_METHODS.SOLANA_SIGN_MESSAGE:
      try {
        const signedMessage = await smartWallet.signMessage(params.message);
        return formatJsonRpcResult(id, signedMessage);
      } catch (err: any) {
        if (isSignMessageError(err)) {
          return rejectSolanaRequest(requestEvent.request);
        }
        console.log(err);
        // Fixme! Need to return a failure response or frontend goes into limbo
        throw err;
      }

    case SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION:
      try {
        const signature = await smartWallet.signTransaction(params);
        return formatJsonRpcResult(id, signature);
      } catch (err: any) {
        if (isSignTransactionError(err)) {
          return rejectSolanaRequest(requestEvent.request);
        }
        console.log(err);
        // Fixme! Need to return a failure response or frontend goes into limbo
        throw err;
      }

    default:
      throw new Error(ERROR.UNKNOWN_JSONRPC_METHOD.format().message);
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
