use std::borrow::BorrowMut;

use anchor_lang::prelude::*;

use crate::PartialSignerSet;

#[derive(Accounts)]
pub struct FreezePartialSignerSet<'info> {
    pub authority: Signer<'info>,

    #[account(mut,
              has_one = authority)]
    pub partial_signer_set: Account<'info, PartialSignerSet>,
}

pub fn freeze_partial_signer_set_handler(ctx: Context<FreezePartialSignerSet>) -> Result<()> {
    let set = ctx.accounts.partial_signer_set.borrow_mut();

    set.frozen = true;

    Ok(())
}
