use anchor_lang::prelude::*;

use crate::state::*;


#[derive(Accounts)]
pub struct CreateTransaction<'info> {
  pub multisig: Box<Account<'info, Multisig>>,
  #[account(zero, signer)]
  pub transaction: Box<Account<'info, Transaction>>,
  // One of the owners. Checked in the handler.
  pub proposer: Signer<'info>,
}

// Creates a new transaction account, automatically signed by the creator,
// which must be one of the owners of the multisig.
pub fn create_transaction_handler(
  ctx: Context<CreateTransaction>,
  instruction: Instuction
) -> Result<()> {
  let multisig = &ctx.accounts.multisig;
  let transaction = &mut ctx.accounts.transaction;
  let proposer = &ctx.accounts.proposer;

  let owner_index = multisig.try_get_owner_index(proposer.key)?;

  let mut signers = Vec::new();
  signers.resize(multisig.owners.len(), false);
  signers[owner_index] = true;

  transaction.program_id = instruction.program_id;
  transaction.accounts = instruction.keys;
  transaction.data = instruction.data;
  transaction.signers = signers;
  transaction.multisig = multisig.key();
  transaction.did_execute = false;
  transaction.owner_set_seqno = multisig.owner_set_seqno;

  Ok(())
}
