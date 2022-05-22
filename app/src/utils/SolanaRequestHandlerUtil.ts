import { SmartWalletContextState } from "@/contexts/SmartWalletContext";
import { SOLANA_SIGNING_METHODS } from "@/data/SolanaChains";
import { formatJsonRpcError, formatJsonRpcResult } from "@json-rpc-tools/utils";
import { TxInterpreter } from "@multisig/multisig-tx";
import { translateAddress } from "@project-serum/anchor";
import { SignaturePubkeyPair } from "@solana/web3.js";
import { RequestEvent } from "@walletconnect/types";
import { ERROR } from "@walletconnect/utils";
import bs58 from "bs58";
import { deserialiseTransaction } from "solana-wallet";
import {
  isSignTransactionError,
  NoSmartWalletError,
  NoWalletError,
} from "./error";

/** Signs a solana request using the wallet adapter */
export async function approveSolanaRequest(
  requestEvent: RequestEvent,
  smartWallet: SmartWalletContextState
) {
  const { method, params, id } = requestEvent.request;
  const { wallet, walletPubkey, smartWalletPk } = smartWallet;

  if (
    !wallet ||
    !walletPubkey ||
    !wallet.signMessage ||
    !wallet.signAllTransactions
  ) {
    throw new NoWalletError();
  }

  switch (method) {
    case SOLANA_SIGNING_METHODS.SOLANA_SIGN_MESSAGE:
      const signedMessage = await wallet.signMessage(
        bs58.decode(params.message)
      );
      const bs58Signature = { signature: bs58.encode(signedMessage) };
      return formatJsonRpcResult(id, bs58Signature);

    case SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION:
      if (!smartWalletPk) {
        throw new NoSmartWalletError();
      }
      const smartWalletAddress = translateAddress(smartWalletPk);

      // Hack to fix array being undefined in `deserializeTransaction`
      // Delete this line when this is merged https://github.com/WalletConnect/solana-wallet/pull/1
      params.partialSignatures ??= [];

      // Interpret the solana request as a multisig transaction before passing it on
      const transaction = deserialiseTransaction(params);
      const { interpreted, txPubkeys } = await TxInterpreter.multisig(
        smartWallet.program,
        smartWalletAddress,
        walletPubkey,
        transaction
      );

      let result: SignaturePubkeyPair | undefined;
      try {
        // Sign
        const signedTransaction = await wallet.signAllTransactions(interpreted);

        // Go fishing for the signature
        result = signedTransaction[0].signatures.find((sig) =>
          sig.publicKey.equals(walletPubkey)
        );
        if (!result || !result.signature) {
          return rejectSolanaRequest(requestEvent.request);
        }
      } catch (err: any) {
        if (isSignTransactionError(err)) {
          return rejectSolanaRequest(requestEvent.request);
        }
        throw err;
      }
      const signature = { signature: bs58.encode(result.signature) };
      return formatJsonRpcResult(id, signature);

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
