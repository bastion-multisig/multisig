use std::borrow::Borrow;

use crate::{seeds::seeds, PartialSignerSet};
use anchor_lang::{
    prelude::*,
    solana_program::{instruction::Instruction, program::invoke_signed},
};

/// Accounts for [partial_signer::invoke_signed].
#[derive(Accounts)]
#[instruction(data: Vec<u8>)]
pub struct InvokeSigned<'info> {
    /// The authority of the [PartialSignerSet]
    pub authority: Signer<'info>,
    /// The [PartialSignerSet] to include partial signers for.
    #[account(has_one = authority)]
    pub partial_signer_set: Account<'info, PartialSignerSet>,
    /// CHECK: The arbitrary program to invoke
    pub program_id: UncheckedAccount<'info>,
}

pub fn invoke_signed_handler(ctx: Context<InvokeSigned>, data: Vec<u8>) -> Result<()> {
    let set = ctx.accounts.partial_signer_set.borrow();

    let seeds = set
        .partial_signers
        .iter()
        .map(|partial_signer| {
            vec![
                seeds::PARTIAL_SIGNER as &[u8],
                set.authority.as_ref(),
                bytemuck::bytes_of(&partial_signer.index),
                bytemuck::bytes_of(&partial_signer.bump),
            ]
        })
        .collect::<Vec<_>>();
    let seeds = seeds.iter().map(|s| &s[..]).collect::<Vec<_>>();

    let accounts = ctx
        .remaining_accounts
        .iter()
        .map(|account| {
            let is_signer = account.is_signer || set.contains_key(&account.key);
            match account.is_writable {
                false => AccountMeta::new_readonly(*account.key, is_signer),
                true => AccountMeta::new(*account.key, is_signer),
            }
        })
        .collect::<Vec<_>>();

    let instruction = Instruction {
        program_id: ctx.accounts.program_id.key(),
        accounts,
        data,
    };

    invoke_signed(&instruction, ctx.remaining_accounts, &seeds)?;

    Ok(())
}
