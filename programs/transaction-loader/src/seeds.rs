use anchor_lang::prelude::*;

pub mod seeds {
    use super::constant;

    #[constant]
    pub const TRANSACTION_DATA: &[u8] = b"transaction";
}
