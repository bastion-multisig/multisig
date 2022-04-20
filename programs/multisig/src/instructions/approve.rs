use std::ops::DerefMut;

use anchor_lang::prelude::*;

use crate::Multisig;
use crate::Transaction;

#[derive(Accounts)]
pub struct Approve<'info> {
  #[account(constraint = multisig.owner_set_seqno == transaction.owner_set_seqno)]
  pub multisig: Box<Account<'info, Multisig>>,
  #[account(mut, has_one = multisig)]
  pub transaction: Box<Account<'info, Transaction>>,
  // One of the multisig owners. Checked in the handler.
  pub owner: Signer<'info>,
}

// Approves a transaction on behalf of an owner of the multisig.
pub fn approve_handler(ctx: Context<Approve>) -> Result<()> {
  let transaction = ctx.accounts.transaction.deref_mut();
  let multisig = &ctx.accounts.multisig;
  let owner = &ctx.accounts.owner;

  let owner_index = multisig.try_get_owner_index(owner.key)?;

  transaction.signers[owner_index] = true;

  Ok(())
}