import { SmartWalletContextState } from "@/contexts/SmartWalletContext";
import { SOLANA_SIGNING_METHODS } from "@/data/SolanaData";
import { getWalletAddressFromParams } from "@/utils/HelperUtil";
import { solanaAddresses, solanaWallets } from "@/utils/SolanaWalletUtil";
import {
  formatJsonRpcError,
  formatJsonRpcResult,
  JsonRpcRequest,
} from "@json-rpc-tools/utils";
import { TxInterpreter } from "@multisig/multisig-tx";
import { translateAddress } from "@project-serum/anchor";
import {
  NonceInformation,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { RequestEvent } from "@walletconnect/types";
import { ERROR } from "@walletconnect/utils";
import base58 from "bs58";
import { SolanaSignTransaction } from "solana-wallet";
import { NoSmartWalletError } from "./error";

/** Interprets the solana request as a multisig transaction */
export async function interpretSolanaRequest(
  requestEvent: RequestEvent,
  smartWallet: SmartWalletContextState
): Promise<RequestEvent> {
  if (!smartWallet.smartWalletPk) {
    throw new NoSmartWalletError();
  }
  const smartWalletAddress = translateAddress(smartWallet.smartWalletPk);

  const request = requestEvent.request as JsonRpcRequest<SolanaSignTransaction>;
  const { method, params, id } = request;

  const wallet =
    solanaWallets[getWalletAddressFromParams(solanaAddresses, params)];

  const { interpreted, txPubkeys } = await TxInterpreter.multisig(
    smartWallet.program,
    smartWalletAddress,
    wallet.keypair.publicKey
    // transaction
  );

  return {
    ...requestEvent,
    request: {
      ...requestEvent.request,
      params: interpreted,
    },
  };
}

/** Signs a solana request using the wallet adapter */
export async function approveSolanaRequest(requestEvent: RequestEvent) {
  const { method, params, id } = requestEvent.request;
  const wallet =
    solanaWallets[getWalletAddressFromParams(solanaAddresses, params)];

  switch (method) {
    case SOLANA_SIGNING_METHODS.SOLANA_SIGN_MESSAGE:
      const signedMessage = await wallet.signMessage(params.message);
      return formatJsonRpcResult(id, signedMessage);

    case SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION:
      const signedTransaction = await wallet.signTransaction(
        params.feePayer,
        params.recentBlockhash,
        params.instructions
      );

      return formatJsonRpcResult(id, signedTransaction);

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

export function decodeTransaction(
  request: JsonRpcRequest<SolanaSignTransaction>
) {
  const { params } = request;
  const nonceInfo = (params as any).nonceInfo;

  const transaction = new Transaction({
    recentBlockhash: params.recentBlockhash,
    feePayer: new PublicKey(params.feePayer),
    nonceInfo: nonceInfo
      ? {
          nonce: nonceInfo.nonce,
          nonceInstruction: decodeInstruction(nonceInfo.nonceInstruction),
        }
      : undefined,
  });

  // transaction.addSignature()
}

export function decodeInstruction(
  instruction: SolanaSignTransaction["instructions"][0]
): TransactionInstruction {
  return new TransactionInstruction({
    programId: new PublicKey(instruction.programId),
    keys: instruction.keys.map((key) => {
      return {
        isSigner: key.isSigner,
        isWritable: key.isWritable,
        pubkey: new PublicKey(key.pubkey),
      };
    }),
    data: instruction.data
      ? Buffer.from(base58.decode(instruction.data))
      : undefined,
  });
}
