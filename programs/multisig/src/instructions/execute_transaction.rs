use std::ops::Deref;

use anchor_lang::prelude::*;
use anchor_lang::solana_program::*;
use anchor_lang::solana_program::instruction::Instruction;

use crate::state::Transaction;
use crate::state::Multisig;
use crate::ErrorCode;

#[derive(Accounts)]
pub struct ExecuteTransaction<'info> {
  #[account(constraint = multisig.owner_set_seqno == transaction.owner_set_seqno,
            has_one = treasury)]
  pub multisig: Account<'info, Multisig>,
  #[account()]
  /// CHECK: 
  pub treasury: UncheckedAccount<'info>,
  #[account(mut, has_one = multisig)]
  pub transaction: Account<'info, Transaction>,
  #[account()]
  pub owner: Signer<'info>
}

// Executes the given transaction if threshold owners have signed it.
pub fn execute_transaction_handler(ctx: Context<ExecuteTransaction>) -> Result<()> {
  let transaction = &mut ctx.accounts.transaction;
  let multisig = &ctx.accounts.multisig;
  let treasury = &ctx.accounts.treasury;

  transaction.validate_executable(&multisig)?;

  // Has this been executed already?
  if transaction.did_execute {
    return Err(ErrorCode::AlreadyExecuted.into());
  }

  // Do we have enough signers.
  let sig_count = transaction
    .signers
    .iter()
    .filter(|&did_sign| *did_sign)
    .count() as u64;
  if sig_count < multisig.threshold {
    return Err(ErrorCode::NotEnoughSigners.into());
  }
  
  // Burn the transaction to ensure one time use.
  transaction.did_execute = true;

  // Execute the transaction signed by the multisig.
  let mut ix: Instruction = ctx.accounts.transaction.deref().into();
  ix.accounts = ix
    .accounts
    .iter()
    .map(|acc| {
      let mut acc = acc.clone();
      if &acc.pubkey == treasury.key {
          acc.is_signer = true;
      }
      acc
    })
    .collect();
  let multisig_key = multisig.key();
  let seeds = &[multisig_key.as_ref(), &multisig.treasury_bump];
  let signer = &[&seeds[..]];
  let accounts = ctx.remaining_accounts;
  program::invoke_signed(&ix, accounts, signer)?;

  Ok(())
}