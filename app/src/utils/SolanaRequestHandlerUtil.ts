import { Transaction } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { SOLANA_SIGNING_METHODS } from "../constants/SolanaData";
import { formatJsonRpcError, formatJsonRpcResult } from "@json-rpc-tools/utils";
import { RequestEvent } from "@walletconnect/types";
import { ERROR } from "@walletconnect/utils";

export async function approveSolanaRequest(
  requestEvent: RequestEvent,
  wallet: WalletContextState
) {
  const { method, params, id } = requestEvent.request;

  if (!wallet.signMessage || !wallet.signTransaction) {
    return formatJsonRpcError(id, ERROR.USER_DISCONNECTED.format().message);
  }

  console.log(params, JSON.stringify(params, undefined, 2));

  switch (method) {
    case SOLANA_SIGNING_METHODS.SOLANA_SIGN_MESSAGE:
      const signedMessage = await wallet.signMessage(params.message);
      return formatJsonRpcResult(id, signedMessage);

    case SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION:
      const signedTransaction = await wallet.signTransaction(params);

      return formatJsonRpcResult(id, signedTransaction);

    default:
      throw new Error(ERROR.UNKNOWN_JSONRPC_METHOD.format().message);
  }
}

export function rejectSolanaRequest(request: RequestEvent["request"]) {
  const { id } = request;

  return formatJsonRpcError(
    id,
    ERROR.JSONRPC_REQUEST_METHOD_REJECTED.format().message
  );
}
