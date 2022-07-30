use crate::seeds::seeds;
use anchor_lang::prelude::*;

/// A partial signer set that creates a set of signatures for the authority
#[account]
#[repr(C)]
pub struct PartialSignerSet {
    /// Only the authority may insert into the partial signer
    pub authority: Pubkey,
    /// The set of partial signers
    pub partial_signers: Vec<PartialSigner>,
}

impl PartialSignerSet {
    /// Returns the space given the number of partial signers
    pub fn space(max_partial_signers: u16) -> usize {
        return 4 // Anchor discriminator 
            + 4 // Vec length
            + std::mem::size_of::<PartialSigner>() * usize::try_from(max_partial_signers).unwrap();
    }

    /// Inserts the partial signer into the array if it hasn't already
    pub fn insert(&mut self, partial_signer_indices: Vec<u64>) {
        for index in partial_signer_indices {
            let exists = self.contains_index(index);

            if !exists {
                let (key, bump) = Pubkey::find_program_address(
                    &[
                        seeds::PARTIAL_SIGNER,
                        self.authority.as_ref(),
                        &index.to_le_bytes(),
                    ],
                    &crate::id(),
                );
                let partial_signer = PartialSigner { key, index, bump };
                self.partial_signers.push(partial_signer)
            }
        }
    }

    pub fn contains_index(&self, index: u64) -> bool {
        self.partial_signers
            .iter()
            .find(|partial_signer| partial_signer.index == index)
            .is_some()
    }

    pub fn contains_key(&self, key: &Pubkey) -> bool {
        self.partial_signers
            .iter()
            .find(|partial_signer| partial_signer.key == *key)
            .is_some()
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Default, Clone, Debug, PartialEq)]
pub struct PartialSigner {
    pub key: Pubkey,
    pub index: u64,
    pub bump: u8,
}
