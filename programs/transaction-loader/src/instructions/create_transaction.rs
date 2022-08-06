use std::borrow::BorrowMut;

use anchor_lang::prelude::*;

use crate::{seeds::seeds, TransactionData};

#[derive(Accounts)]
#[instruction(space: u64, seed: u64)]
pub struct CreateTransaction<'info> {
    #[account()]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(init,
              seeds = [
                &seeds::TRANSACTION_DATA,
                authority.key.as_ref(),
                seed.to_le_bytes().as_ref()
              ],
              bump,
              payer = payer,
              space = space.try_into().unwrap())]
    pub transaction: Account<'info, TransactionData>,

    pub system_program: Program<'info, System>,
}

pub fn create_transaction_handler(
    ctx: Context<CreateTransaction>,
    _space: u64,
    _seed: u64,
) -> Result<()> {
    let transaction = ctx.accounts.transaction.borrow_mut();

    transaction.authority = ctx.accounts.authority.key();

    Ok(())
}
