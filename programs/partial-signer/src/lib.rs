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

declare_id!("5wmGZYQhfGLDdo1zUh2cUnbs8KjF2HZWwwt6VAkUQwpF");

#[program]
pub mod partial_signer {
    use super::*;

    pub fn init_partial_signer_set(
        ctx: Context<InitPartialSignerSet>,
        seed: Pubkey,
        partial_signers: Vec<Pubkey>,
        max_partial_signers: u16,
    ) -> Result<()> {
        instructions::init_partial_signer_set_handler(
            ctx,
            seed,
            partial_signers,
            max_partial_signers,
        )
    }

    pub fn add_partial_signers(
        ctx: Context<AddPartialSigners>,
        partial_signers: Vec<Pubkey>,
    ) -> Result<()> {
        instructions::add_partial_signers_handler(ctx, partial_signers)
    }

    pub fn freeze_partial_signer_set(ctx: Context<FreezePartialSignerSet>) -> Result<()> {
        instructions::freeze_partial_signer_set_handler(ctx)
    }

    pub fn invoke_signed(ctx: Context<InvokeSigned>, data: Vec<u8>) -> Result<()> {
        instructions::invoke_signed_handler(ctx, data)
    }
}

/// Program errors.
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid partial signer authority")]
    InvalidPartialSignerAuthority,
}
