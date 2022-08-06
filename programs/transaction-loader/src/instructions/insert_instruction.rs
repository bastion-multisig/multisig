use std::borrow::BorrowMut;

use anchor_lang::prelude::*;

use crate::{InstructionData, TransactionData};

#[derive(Accounts)]
#[instruction(instruction_data: InstructionData)]
pub struct InsertInstruction<'info> {
    pub authority: Signer<'info>,

    #[account(mut, has_one = authority)]
    pub transaction: Account<'info, TransactionData>,
}

pub fn insert_instruction_handler(
    ctx: Context<InsertInstruction>,
    instruction_data: InstructionData,
) -> Result<()> {
    let transaction = ctx.accounts.transaction.borrow_mut();

    // Accounts could be stored in remaining accounts which would dedupe
    // accounts to reduce tx size further but cost 5000 lamports each

    transaction.instructions.push(instruction_data);

    Ok(())
}
