import { SmartWalletContextState } from "@/contexts/SmartWalletContext";
import { SOLANA_SIGNING_METHODS } from "@/data/SolanaData";
import {
  formatJsonRpcError,
  formatJsonRpcResult,
  JsonRpcRequest,
} from "@json-rpc-tools/utils";
import { TxInterpreter } from "@multisig/multisig-tx";
import { translateAddress } from "@project-serum/anchor";
import {
  PublicKey,
  SignaturePubkeyPair,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { RequestEvent } from "@walletconnect/types";
import { ERROR } from "@walletconnect/utils";
import bs58 from "bs58";
import base58 from "bs58";
import { SolanaSignTransaction } from "solana-wallet";
import { NoSmartWalletError, NoWalletError } from "./error";

/** Interprets the solana request as a multisig transaction */
export async function interpretSolanaRequest(
  requestEvent: RequestEvent,
  smartWallet: SmartWalletContextState
): Promise<Transaction[]> {
  if (!smartWallet.smartWalletPk) {
    throw new NoSmartWalletError();
  }
  if (!smartWallet.walletPubkey) {
    throw new NoWalletError();
  }

  const smartWalletAddress = translateAddress(smartWallet.smartWalletPk);

  const request = requestEvent.request as JsonRpcRequest<SolanaSignTransaction>;
  const { method, params, id } = request;

  const transaction = decodeTransaction(params);

  const { interpreted, txPubkeys } = await TxInterpreter.multisig(
    smartWallet.program,
    smartWalletAddress,
    smartWallet.walletPubkey,
    transaction
  );

  return interpreted;
}

/** Signs a solana request using the wallet adapter */
export async function approveSolanaRequest(
  requestEvent: RequestEvent,
  interpreted: Transaction[] | undefined,
  smartWallet: SmartWalletContextState
) {
  const { method, params, id } = requestEvent.request;
  const { wallet } = smartWallet;

  if (!wallet || !wallet.signMessage || !wallet.signAllTransactions) {
    throw new NoWalletError();
  }

  switch (method) {
    case SOLANA_SIGNING_METHODS.SOLANA_SIGN_MESSAGE:
      const signedMessage = await wallet.signMessage(
        bs58.decode(params.message)
      );
      const bs58Signature = bs58.encode(signedMessage);
      return formatJsonRpcResult(id, bs58Signature);

    case SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION:
      if (!interpreted) {
        throw new Error("Missing interpreted transactions");
      }
      const signedTransaction = await wallet.signAllTransactions(interpreted);

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

export function decodeTransaction(params: SolanaSignTransaction) {
  // Instructions
  const instructions = params.instructions.map(decodeInstruction);

  // Nonce, if any
  const nonceParams = (params as any).nonceInfo;
  const nonceInfo = nonceParams
    ? {
        nonce: nonceParams.nonce,
        nonceInstruction: decodeInstruction(nonceParams.nonceInstruction),
      }
    : undefined;

  // Signatures
  const signatures: SignaturePubkeyPair[] | undefined = params.partialSignatures
    ? params.partialSignatures.map((sig) => {
        return {
          publicKey: new PublicKey(sig.pubkey),
          signature: Buffer.from(base58.decode(sig.signature)),
        };
      })
    : undefined;

  // Build the transaction
  const transaction = new Transaction({
    recentBlockhash: params.recentBlockhash,
    feePayer: new PublicKey(params.feePayer),
    nonceInfo,
    signatures: signatures,
  });
  transaction.add(...instructions);

  return transaction;
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
