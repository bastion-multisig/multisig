import { AnchorProvider, Program, BN } from "@project-serum/anchor";
import {
  AccountMeta,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { SmartWallet } from "../../../deps/smart_wallet";
import {
  SmartWalletTransactionData,
  SubaccountInfoData,
  findTransactionAddress,
  findSubaccountInfoAddress,
  findWalletDerivedAddress,
} from "@gokiprotocol/client";

export function multisigSize(owners: number) {
  return owners * 32 + 96;
}

export async function createTransaction(
  program: Program<SmartWallet>,
  smartWallet: PublicKey,
  proposer: PublicKey,
  instructions: TransactionInstruction[]
) {
  const provider = program.provider as AnchorProvider;
  const multisigInfo = await program.account.smartWallet.fetch(smartWallet);
  const txIndex = multisigInfo.numTransactions.toNumber();
  const [transaction, transactionBump] = await findTransactionAddress(
    smartWallet,
    txIndex
  );

  const builder = program.methods
    .createTransaction(transactionBump, instructions)
    .accounts({
      smartWallet,
      transaction,
      proposer,
      payer: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })

  return { transaction, builder };
}

export async function executeTransaction(
  program: Program<SmartWallet>,
  transaction: PublicKey,
  owner: Keypair,
  walletIndex: number
) {
  const { accounts, remainingAccounts, walletBump } =
    await executeTransactionContext(
      program,
      transaction,
      owner.publicKey,
      walletIndex
    );

  return await program.methods
    .executeTransactionDerived(new BN(walletIndex), walletBump)
    .accounts(accounts)
    .signers([owner])
    .remainingAccounts(remainingAccounts)
    .rpc();
}

async function executeTransactionContext(
  program: Program<SmartWallet>,
  transaction: PublicKey,
  owner: PublicKey,
  walletIndex: number
) {
  const txInfo = (await program.account.transaction.fetch(
    transaction
  )) as SmartWalletTransactionData;
  const smartWallet = txInfo.smartWallet;

  const uniqueKeys = getUniqueKeys(txInfo.instructions);
  await setDerivedSubaccountsAsNonSigner(program, smartWallet, uniqueKeys);

  const [walletDerivedAddress, walletBump] = await findWalletDerivedAddress(
    smartWallet,
    walletIndex
  );

  // if (uniqueKeys.some((key) => key.pubkey.equals(walletDerivedAddress))) {
  //   throw new Error(
  //     `Wallet index ${walletIndex} is a PDA signer but it's not found in the array of keys.`
  //   );
  // }

  return {
    accounts: {
      smartWallet: txInfo.smartWallet,
      transaction,
      owner,
    },
    remainingAccounts: uniqueKeys,
    walletBump,
  };
}

function getUniqueKeys(
  instructions: SmartWalletTransactionData["instructions"]
) {
  // Concat all keys and programIds into a AccountMeta[]
  const keys = instructions.flatMap((ix) =>
    ix.keys.concat({ pubkey: ix.programId, isSigner: false, isWritable: false })
  );

  const unique: Record<string, AccountMeta> = {};

  // Dedupe keys
  for (const key of keys) {
    const keyStr = key.pubkey.toBase58();
    const entry = unique[keyStr];
    if (entry) {
      entry.isSigner ||= key.isSigner;
      entry.isWritable ||= key.isWritable;
    } else {
      unique[keyStr] = { ...key };
    }
  }
  return Object.values(unique);
}

async function setDerivedSubaccountsAsNonSigner(
  program: Program<SmartWallet>,
  smartWallet: PublicKey,
  accounts: AccountMeta[]
) {
  const signers = accounts.filter((acc) => acc.isSigner);
  const subaccounts = (
    await Promise.all(
      signers.map((signer) => findSubaccountInfoAddress(signer.pubkey))
    )
  ).map(([subaccount]) => subaccount);
  const subaccountInfos = (await program.account.subaccountInfo.fetchMultiple(
    subaccounts
  )) as SubaccountInfoData[];

  for (let i = 0; i < signers.length; i++) {
    const signer = signers[i];
    const subaccountInfo = subaccountInfos[i];
    if (!subaccountInfo) {
      throw new Error(
        `Account ${signer.pubkey} is a signer but not a Goki subaccount. It is unknown if signature verification will fail. Create a Goki subaccount for this account.`
      );
    } else if (!subaccountInfo.smartWallet.equals(smartWallet)) {
      throw new Error(
        `Unexpected smart wallet for Goki account ${signer.pubkey.toBase58()}.
        Expected smart wallet ${smartWallet.toBase58()}.
        Actual smart wallet ${subaccountInfo.smartWallet.toBase58()}.`
      );
    } else if (!(subaccountInfo as any).subaccountType.derived) {
      throw new Error(
        "Subaccount is a signer but subaccount type is not 'Derived'. Not implemented"
      );
    } else {
      signer.isSigner = false;
    }
  }
}
