use anchor_lang::prelude::*;

pub mod seeds {
    use super::constant;

    pub const PARTIAL_SIGNER: &[u8] = b"partal-signer";

    #[constant]
    pub const PARTIAL_SIGNER_SET: &[u8] = b"partial-signer-set";
}
