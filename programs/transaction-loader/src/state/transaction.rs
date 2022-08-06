use crate::ErrorCode;
use anchor_lang::prelude::*;
use spl_governance::state::proposal_transaction::{AccountMetaDataBrief, InstructionDataBrief};

#[account]
pub struct TransactionData {
    /// The authority to modify or close the account
    pub authority: Pubkey,
    /// Stored instructions
    pub instructions: Vec<InstructionData>,
}

impl TransactionData {
    /// Validates that the account metadata matches the instruction metadata.
    /// Returns keys of the account metadata.
    pub fn validate_account_infos<'info>(
        &self,
        account_infos: &[AccountInfo<'info>],
    ) -> Result<Vec<Pubkey>> {
        let mut account_iter = account_infos.iter();

        let mut keys = vec![];
        for ix in &self.instructions {
            let program_id = account_iter
                .next()
                .ok_or(ErrorCode::InsufficientRemainingAccounts)?;
            if ix.program_id != program_id.key.clone() {
                return Err(ErrorCode::InvalidInnerProgramId.into());
            }
            if program_id.is_signer {
                return Err(ErrorCode::InvalidInnerProgramIdSigner.into());
            }
            if program_id.is_writable {
                return Err(ErrorCode::InvalidInnerProgramIdWritable.into());
            }
            keys.push(program_id.key().clone());

            for key in &ix.accounts {
                let account = account_iter
                    .next()
                    .ok_or(ErrorCode::InsufficientRemainingAccounts)?;

                if key.pubkey != account.key.clone() {
                    return Err(ErrorCode::InvalidInnerAccount.into());
                }
                if account.is_signer {
                    return Err(ErrorCode::InvalidInnerAccountSigner.into());
                }
                if account.is_writable {
                    return Err(ErrorCode::InvalidInnerAccountWritable.into());
                }
                keys.push(key.pubkey);
            }
        }
        Ok(keys)
    }
}

/// InstructionData wrapper. It can be removed once Borsh serialization for Instruction is supported in the SDK
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct InstructionData {
    /// Pubkey of the instruction processor that executes this instruction
    pub program_id: Pubkey,
    /// Metadata for what accounts should be passed to the instruction processor
    pub accounts: Vec<AccountMetaData>,
    /// Opaque data passed to the instruction processor
    pub data: Vec<u8>,
}

impl Into<InstructionDataBrief> for &InstructionData {
    fn into(self) -> InstructionDataBrief {
        let accounts = self
            .accounts
            .iter()
            .map(|acc| acc.clone().into())
            .collect::<Vec<_>>();
        InstructionDataBrief {
            accounts,
            data: self.data.clone(),
        }
    }
}

/// Account metadata used to define Instructions
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct AccountMetaData {
    /// An account's public key
    pub pubkey: Pubkey,
    /// True if an Instruction requires a Transaction signature matching `pubkey`.
    pub is_signer: bool,
    /// True if the `pubkey` can be loaded as a read-write account.
    pub is_writable: bool,
}

impl Into<AccountMetaDataBrief> for AccountMetaData {
    fn into(self) -> AccountMetaDataBrief {
        AccountMetaDataBrief {
            is_signer: self.is_signer,
            is_writable: self.is_writable,
        }
    }
}
