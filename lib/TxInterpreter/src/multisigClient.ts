import { AnchorProvider, Program, BN } from "@project-serum/anchor";
import { AccountMeta, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  findSubaccountInfoAddress,
  findTransactionAddress,
  findWalletDerivedAddress,
  findWalletPartialSignerAddress,
} from "./pda";
import {
  PartialSignerAndKey,
  SmartWalletTransactionData,
  SubaccountInfoData,
  TXInstruction,
} from "./types";
import { SmartWallet } from "./idl/smart_wallet";
import { getUniqueKeys, randomU64 } from "./transactionUtil";

export function multisigSize(owners: number) {
  return owners * 32 + 96;
}

export function createMultisigTransaction(
  program: Program<SmartWallet>,
  smartWallet: PublicKey,
  transactionIndex: BN,
  instructions: TXInstruction[]
) {
  const provider = program.provider as AnchorProvider;
  const [transaction, transactionBump] = findTransactionAddress(
    smartWallet,
    transactionIndex
  );

  const remainingAccounts: AccountMeta[] = instructions
    .map((ix) => {
      return [
        {
          pubkey: ix.programId,
          isSigner: false,
          isWritable: false,
        },
        ...ix.keys.map((key) => {
          return {
            pubkey: key.pubkey,
            isSigner: false,
            isWritable: false,
          };
        }),
      ];
    })
    .reduce((reducer, keys) => [...reducer, ...keys], []);

  // It is not strictly necessary to only necessary fields, but it's done anyway
  const instructionArgs = instructions.map((ix) => {
    return {
      keys: ix.keys.map((key) => {
        return {
          isSigner: key.isSigner,
          isWritable: key.isWritable,
        };
      }),
      data: ix.data,
      partialSigners: ix.partialSigners,
    };
  });

  const builder = program.methods
    .createTransaction(transactionBump, instructionArgs)
    .accounts({
      smartWallet,
      transaction,
      proposer: provider.wallet.publicKey,
      payer: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .remainingAccounts(remainingAccounts);

  return { address: transaction, builder };
}

export async function executeMultisigTransaction(
  program: Program<SmartWallet>,
  transaction: PublicKey,
  walletDerivedIndex: BN
) {
  const { accounts, remainingAccounts, walletBump } =
    await executeMultisigTransactionContext(
      program,
      transaction,
      walletDerivedIndex
    );

  return program.methods
    .executeTransactionDerived(new BN(walletDerivedIndex), walletBump)
    .accounts(accounts)
    .remainingAccounts(remainingAccounts);
}

async function executeMultisigTransactionContext(
  program: Program<SmartWallet>,
  transaction: PublicKey,
  walletDerivedIndex: BN
) {
  const txInfo = (await program.account.transaction.fetch(
    transaction
  )) as SmartWalletTransactionData;
  const smartWallet = txInfo.smartWallet;

  const remainingAccounts = getUniqueKeys((txInfo as any).instructions);

  for (let i = 0; i < remainingAccounts.length; i++) {
    if (remainingAccounts[i].isSigner) {
      remainingAccounts[i].isSigner = false;
    }
  }

  const [_walletDerivedAddress, walletBump] = findWalletDerivedAddress(
    smartWallet,
    walletDerivedIndex
  );

  return {
    accounts: {
      smartWallet: txInfo.smartWallet,
      transaction,
    },
    remainingAccounts,
    walletBump,
  };
}

export async function keysToMultisigSubaccounts(
  program: Program<SmartWallet>,
  smartWallet: PublicKey,
  keys: PublicKey[]
) {
  const addresses: PublicKey[] = [];
  for (let i = 0; i < keys.length; i++) {
    const [address, _bump] = findSubaccountInfoAddress(keys[i]);
    addresses[i] = address;
  }

  let subaccounts = (await program.account.subaccountInfo.fetchMultiple(
    addresses
  )) as (SubaccountInfoData | null)[];

  const map: Record<string, SubaccountInfoData> = {};
  for (let i = 0; i < keys.length; i++) {
    const subaccount = subaccounts[i];
    if (
      subaccount &&
      subaccount.smartWallet.equals(smartWallet) &&
      subaccount.subaccountType.hasOwnProperty("derived")
    ) {
      map[keys[i].toBase58()] = subaccount;
    }
  }
  return map;
}

/**
 * For every signer, if the signer does not have a subaccount, return a
 * map of the signer pubkey to a partial signer record.
 */
export function getRandomMultisigPartialSigners(
  smartWallet: PublicKey,
  signers: PublicKey[]
) {
  const partialSigners: Record<string, PartialSignerAndKey> = {};
  for (let i = 0; i < signers.length; i++) {
    const signer = signers[i];
    const keyStr = signer.toBase58();
    const partialSigner = partialSigners[keyStr];
    if (!partialSigner) {
      partialSigners[keyStr] = getRandomMultisigPartialSigner(smartWallet);
    }
  }
  return partialSigners;
}

export function getRandomMultisigPartialSigner(
  smartWallet: PublicKey
): PartialSignerAndKey {
  const index = randomU64();
  const [pubkey, bump] = findWalletPartialSignerAddress(smartWallet, index);
  return {
    index,
    bump,
    pubkey,
  };
}
