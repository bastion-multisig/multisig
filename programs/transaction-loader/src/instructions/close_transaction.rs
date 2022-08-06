use anchor_lang::prelude::*;

use crate::TransactionData;

#[derive(Accounts)]
#[instruction()]
pub struct CloseTransaction<'info> {
    #[account()]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub receiver: Signer<'info>,

    #[account(mut,
              close = receiver,
              has_one = authority)]
    pub transaction: Account<'info, TransactionData>,
}

pub fn close_transaction_handler(_ctx: Context<CloseTransaction>) -> Result<()> {
    Ok(())
}
