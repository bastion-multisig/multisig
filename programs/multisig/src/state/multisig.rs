use anchor_lang::prelude::*;

use crate::errors::ErrorCode;

#[account()]
pub struct Multisig {
  /// The pubkey of the multisig
  pub pubkey: Pubkey,
  /// Multisig wallet to store sol.
  /// It is the signer when interacting with programs, this
  /// allows it to own SPL tokens and interface with defi.
  pub treasury: Pubkey,
  pub treasury_bump: [u8; 1],
  pub threshold: u64, //82
  pub owner_set_seqno: u32,
  /// Reserved space for future versions
  pub reserved: [u8; 7],
  pub owners: Vec<Pubkey>,
}

impl Multisig {
  pub fn treasury_seeds(&self) -> [&[u8]; 2] {
    [self.pubkey.as_ref(), &self.treasury_bump]
  }

  pub fn try_get_owner_index(&self, owner: &Pubkey) -> Result<usize> {
    let index = self
      .owners
      .iter()
      .position(|a| a == owner)
      .ok_or(ErrorCode::InvalidOwner)?;
      
    Ok(index)
  }
}