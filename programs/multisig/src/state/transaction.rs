use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::prelude::*;
use crate::Multisig;
use crate::errors::ErrorCode;

#[account]
pub struct Transaction {
  // The multisig account this transaction belongs to.
  pub multisig: Pubkey,
  // Target program to execute against.
  pub program_id: Pubkey,
  // Accounts requried for the transaction.
  pub accounts: Vec<TransactionAccount>,
  // Instruction data for the transaction.
  pub data: Vec<u8>,
  // signers[index] is true iff multisig.owners[index] signed the transaction.
  pub signers: Vec<bool>,
  // Boolean ensuring one time execution.
  pub did_execute: bool,
  // Owner set sequence number.
  pub owner_set_seqno: u32,
}

impl Transaction {
  pub fn validate_executable(&self, multisig: &Multisig) -> Result<()> {
    // Has this been executed already?
    if self.did_execute {
      return Err(ErrorCode::AlreadyExecuted.into());
    }

    // Do we have enough signers.
    let sig_count = self
      .signers
      .iter()
      .filter(|&did_sign| *did_sign)
      .count() as u64;
    if sig_count < multisig.threshold {
      return Err(ErrorCode::NotEnoughSigners.into());
    }

    Ok(())
  }
}

impl From<&Transaction> for Instruction {
  fn from(tx: &Transaction) -> Instruction {
      Instruction {
          program_id: tx.program_id,
          accounts: tx.accounts.iter().map(Into::into).collect(),
          data: tx.data.clone(),
      }
  }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Instuction {
    /// Pubkey of the program that executes this instruction.
    pub program_id: Pubkey,
    /// Metadata describing accounts that should be passed to the program.
    pub keys: Vec<TransactionAccount>,
    /// Opaque data passed to the program for its own interpretation.
    pub data: Vec<u8>,
  }

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TransactionAccount {
    pub pubkey: Pubkey,
    pub is_signer: bool,
    pub is_writable: bool,
}

impl From<&TransactionAccount> for AccountMeta {
    fn from(account: &TransactionAccount) -> AccountMeta {
        match account.is_writable {
            false => AccountMeta::new_readonly(account.pubkey, account.is_signer),
            true => AccountMeta::new(account.pubkey, account.is_signer),
        }
    }
}

impl From<&AccountMeta> for TransactionAccount {
    fn from(account_meta: &AccountMeta) -> TransactionAccount {
        TransactionAccount {
            pubkey: account_meta.pubkey,
            is_signer: account_meta.is_signer,
            is_writable: account_meta.is_writable,
        }
    }
}
