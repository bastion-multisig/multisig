use std::borrow::Borrow;

use anchor_lang::{prelude::*, solana_program::program::invoke};
use spl_governance::state::proposal_transaction::InstructionDataBrief;

use crate::TransactionData;

#[derive(Accounts)]
#[instruction(    
    option_index: u8,
    index: u16,
    hold_up_time: u32)]
pub struct GovernanceInsertTransaction<'info> {
    pub transaction: Account<'info, TransactionData>,

    #[account(owner = governance_program.key())]
    /// CHECK: Account must be owned by governance program
    pub governance: UncheckedAccount<'info>,

    #[account(mut,
              owner = governance_program.key())]
    /// CHECK: Account must be owned by governance program
    pub proposal: UncheckedAccount<'info>,

    #[account(owner = governance_program.key())]
    /// CHECK: Account must be owned by governance program
    pub token_owner_record: UncheckedAccount<'info>,

    pub governance_authority: Signer<'info>,

    #[account(mut)]
    pub proposal_transaction: SystemAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,

    #[account(executable)]
    /// CHECK: Governance can be any arbitrary account
    pub governance_program: UncheckedAccount<'info>,
}

impl<'info> GovernanceInsertTransaction<'info> {
    fn deposit_gov_tokens(&self, 
        option_index: u8,
        index: u16,
        hold_up_time: u32,
        remaining_accounts: &[AccountInfo<'info>],
        instructions: Vec<InstructionDataBrief>,
    ) -> Result<()> {
        let inner_accounts = self.transaction.validate_account_infos(remaining_accounts)?;
        
        let ix = spl_governance::instruction::insert_transaction_brief(
            self.governance_program.key,
            // Accounts
            self.governance.key,
            self.proposal.key,
            self.token_owner_record.key,
            self.governance_authority.key,
            self.payer.key,
            inner_accounts,
            // Args, 
            option_index,
            index,
            hold_up_time,
            instructions,
        );


        let mut account_infos = vec![
            self.governance.to_account_info(),
            self.proposal.to_account_info(),
            self.token_owner_record.to_account_info(),
            self.governance_authority.to_account_info(),
            self.proposal_transaction.to_account_info(),
            self.payer.to_account_info(),
            self.system_program.to_account_info(),
            self.rent.to_account_info(),
            self.governance_program.to_account_info(),
        ];
        
        account_infos.extend(Vec::from(remaining_accounts));

        invoke(
            &ix,
            &account_infos,
        )
        .map_err(Into::into)
    }
}

pub fn governance_insert_transaction_handler<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, GovernanceInsertTransaction<'info>>,
    option_index: u8,
    index: u16,
    hold_up_time: u32,
) -> Result<()> {
    let transaction = ctx.accounts.transaction.borrow();
    
    let instructions = transaction.instructions.iter().map(Into::into).collect();

    ctx.accounts.deposit_gov_tokens(option_index, index, hold_up_time, ctx.remaining_accounts, instructions)?;

    Ok(())
}
