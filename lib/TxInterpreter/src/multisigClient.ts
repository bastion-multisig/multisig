import { Program } from "@project-serum/anchor";
import {
  AccountMeta,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { SerumMultisig } from "../../../target/types/serum_multisig";

export function multisigSize(owners: number) {
  return owners * 32 + 96;
}

export async function createTransaction(
  program: Program<SerumMultisig>,
  multisig: PublicKey,
  proposer: Keypair,
  instructionInfo: TransactionInstruction
) {
  const transaction = Keypair.generate();
  const transactionSize = 400; // Big enough cuz lazy
  await program.methods
    .createTransaction(instructionInfo)
    .accounts({
      multisig: multisig,
      transaction: transaction.publicKey,
      proposer: proposer.publicKey,
    })
    .signers([proposer, transaction])
    .preInstructions([
      await program.account.transaction.createInstruction(
        transaction,
        transactionSize
      ),
    ])
    .rpc();
  return transaction.publicKey;
}

export async function approveAndExecute(
  program: Program<SerumMultisig>,
  multisig: PublicKey,
  treasury: PublicKey,
  approver: Keypair,
  transaction: PublicKey
) {
  const txInfo = await program.account.transaction.fetch(transaction);
  const accounts = txInfo.accounts as AccountMeta[];

  console.log("Approving");
  await program.methods
    .approve()
    .accounts({
      multisig,
      transaction,
      owner: approver.publicKey,
    })
    .signers([approver])
    .rpc();

  console.log(JSON.stringify(accounts));

  await program.methods
    .executeTransaction()
    .accounts({
      multisig,
      treasury,
      transaction,
      owner: approver.publicKey,
    })
    .signers([approver])
    .remainingAccounts(
      // Change the signer status on the treasury signer since it's signed by the program, not the client.
      accounts
        .map((meta) =>
          meta.pubkey.equals(treasury) ? { ...meta, isSigner: false } : meta
        )
        .concat({
          pubkey: txInfo.programId,
          isWritable: false,
          isSigner: false,
        })
    )
    .rpc();
}
