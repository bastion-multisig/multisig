use std::borrow::BorrowMut;

use anchor_lang::prelude::*;

use crate::PartialSignerSet;

#[derive(Accounts)]
#[instruction(partial_signers: Vec<Pubkey>)]
pub struct AddPartialSigners<'info> {
    pub authority: Signer<'info>,

    #[account(has_one = authority,
              constraint = partial_signer_set.frozen == false)]
    pub partial_signer_set: Account<'info, PartialSignerSet>,
}

pub fn add_partial_signers_handler(
    ctx: Context<AddPartialSigners>,
    partial_signers: Vec<Pubkey>,
) -> Result<()> {
    let set = ctx.accounts.partial_signer_set.borrow_mut();

    set.insert(partial_signers);

    Ok(())
}
