//! Multisig Solana wallet with Timelock capabilities.
//!
//! This program can be used to allow a smart wallet to govern anything a regular
//! [Pubkey] can govern. One can use the smart wallet as a BPF program upgrade
//! authority, a mint authority, etc.
//!
//! To use, one must first create a [SmartWallet] account, specifying two important
//! parameters:
//!
//! 1. Owners - the set of addresses that sign transactions for the smart wallet.
//! 2. Threshold - the number of signers required to execute a transaction.
//! 3. Minimum Delay - the minimum amount of time that must pass before a [Transaction]
//!                    can be executed. If 0, this is ignored.
//!
//! Once the [SmartWallet] account is created, one can create a [Transaction]
//! account, specifying the parameters for a normal Solana instruction.
//!
//! To sign, owners should invoke the [smart_wallet::approve] instruction, and finally,
//! [smart_wallet::execute_transaction], once enough (i.e. [SmartWallet::threshold]) of the owners have
//! signed.
#![deny(rustdoc::all)]
#![allow(rustdoc::missing_doc_code_examples)]
#![deny(clippy::unwrap_used)]

use anchor_lang::prelude::*;

mod instructions;
mod seeds;
mod state;

pub use instructions::*;
pub use seeds::*;
pub use state::*;

declare_id!("8FjwT1Bbjaxx3uYhvMne4vKQsQvx2mP7fwYfw3EAuWzF");

#[program]
pub mod transaction_loader {
    use super::*;

    pub fn close_transaction(ctx: Context<CloseTransaction>) -> Result<()> {
        instructions::close_transaction_handler(ctx)
    }

    pub fn create_transaction(
        ctx: Context<CreateTransaction>,
        space: u64,
        seed: u64,
    ) -> Result<()> {
        instructions::create_transaction_handler(ctx, space, seed)
    }

    pub fn governance_insert_transaction<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, GovernanceInsertTransaction<'info>>,
        option_index: u8,
        index: u16,
        hold_up_time: u32,
    ) -> Result<()> {
        instructions::governance_insert_transaction_handler(ctx, option_index, index, hold_up_time)
    }

    pub fn insert_instruction(
        ctx: Context<InsertInstruction>,
        instruction_data: InstructionData,
    ) -> Result<()> {
        instructions::insert_instruction_handler(ctx, instruction_data)
    }
}

/// Program errors.
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid partial signer authority")]
    InvalidPartialSignerAuthority,
    #[msg("The program ID within remaining accounts does not match")]
    InvalidInnerProgramId,
    #[msg("The inner program ID signer is not false")]
    InvalidInnerProgramIdSigner,
    #[msg("The inner program ID writable is not false")]
    InvalidInnerProgramIdWritable,
    #[msg("The inner account info pubkey does not match")]
    InvalidInnerAccount,
    #[msg("The inner account info signer is not false")]
    InvalidInnerAccountSigner,
    #[msg("The inner account info writable is not false")]
    InvalidInnerAccountWritable,
    #[msg("Insufficient remaining accounts for transaction")]
    InsufficientRemainingAccounts,
}
