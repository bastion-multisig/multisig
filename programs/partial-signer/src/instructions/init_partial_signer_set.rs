use std::borrow::{Borrow, BorrowMut};

use anchor_lang::prelude::*;

use crate::{seeds::seeds, PartialSignerSet};

#[derive(Accounts)]
#[instruction(seed: u64, partial_signers: Vec<u64>, max_partial_signers: u16)]
pub struct InitPartialSignerSet<'info> {
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(init,
              seeds = [
                &seeds::PARTIAL_SIGNER_SET,
                authority.key.as_ref(),
                seed.to_le_bytes().as_ref()
              ],
              bump,
              payer = payer,
              space = PartialSignerSet::space(max_partial_signers))]
    pub partial_signer_set: Account<'info, PartialSignerSet>,

    pub system_program: Program<'info, System>,
}

pub fn init_partial_signer_set_handler(
    ctx: Context<InitPartialSignerSet>,
    _seed: u64,
    partial_signers: Vec<u64>,
    _max_partial_signers: u16,
) -> Result<()> {
    let set = ctx.accounts.partial_signer_set.borrow_mut();
    let authority = ctx.accounts.authority.borrow();

    set.authority = authority.key.clone();
    set.insert(partial_signers);

    Ok(())
}
