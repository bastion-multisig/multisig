use anchor_lang::prelude::*;

use crate::assert_unique_owners;
use crate::state::*;
use crate::ErrorCode;

#[derive(Accounts)]
pub struct Auth<'info> {
  #[account(mut,
            has_one = treasury)]
  pub multisig: Box<Account<'info, Multisig>>,
  pub treasury: Signer<'info>,
}

// Set owners and threshold at once.
pub fn set_owners_and_change_threshold_handler<'info>(
  ctx: Context<'_, '_, '_, 'info, Auth<'info>>,
  owners: Vec<Pubkey>,
  threshold: u64,
) -> Result<()> {
  set_owners_handler(
    Context::new(
        ctx.program_id,
        ctx.accounts,
        ctx.remaining_accounts,
        ctx.bumps.clone(),
    ),
    owners,
  )?;
  change_threshold_handler(ctx, threshold)
}

// Sets the owners field on the multisig. The only way this can be invoked
// is via a recursive call from execute_transaction -> set_owners.
pub fn set_owners_handler(ctx: Context<Auth>, owners: Vec<Pubkey>) -> Result<()> {
  assert_unique_owners(&owners)?;
  require!(!owners.is_empty(), InvalidOwnersLen);

  let multisig = &mut ctx.accounts.multisig;

  if (owners.len() as u64) < multisig.threshold {
      multisig.threshold = owners.len() as u64;
  }

  multisig.owners = owners;
  multisig.owner_set_seqno += 1;

  Ok(())
}

// Changes the execution threshold of the multisig. The only way this can be
// invoked is via a recursive call from execute_transaction ->
// change_threshold.
pub fn change_threshold_handler(ctx: Context<Auth>, threshold: u64) -> Result<()> {
  require!(threshold > 0, InvalidThreshold);

  let multisig = &mut ctx.accounts.multisig;

  if threshold > multisig.owners.len() as u64 {
      return Err(ErrorCode::InvalidThreshold.into());
  }

  multisig.threshold = threshold;
  Ok(())
}