use anchor_lang::prelude::*;

use crate::state::Multisig;
use crate::assert_unique_owners;

#[derive(Accounts)]
pub struct CreateMultisig<'info> {
  #[account(zero)]
  pub multisig: Account<'info, Multisig>,
  #[account(
    seeds = [
      multisig.key().as_ref(),
    ],
    bump,
  )]
  /// CHECK:
  pub treasury: UncheckedAccount<'info>,
}

// Initializes a new multisig account with a set of owners and a threshold.
pub fn create_multisig_handler(
  ctx: Context<CreateMultisig>,
  owners: Vec<Pubkey>,
  threshold: u64,
) -> Result<()> {
  let multisig = &mut ctx.accounts.multisig;

  assert_unique_owners(&owners)?;
  require!(
    threshold > 0 && threshold <= owners.len() as u64,
    InvalidThreshold
  );
  require!(!owners.is_empty(), InvalidOwnersLen);

  multisig.treasury = ctx.accounts.treasury.key();
  multisig.treasury_bump[0] = *ctx.bumps.get("treasury").unwrap();
  multisig.owners = owners;
  multisig.threshold = threshold;
  multisig.owner_set_seqno = 0;
  Ok(())
}