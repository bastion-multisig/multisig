const { LOCALHOST, tmpLedgerDir }  = require('@metaplex-foundation/amman');
const { PublicKey } = require('@solana/web3.js');

module.exports = {
  validator: {
    killRunningValidators: true,
    programs: [
      {
        label: "smart_wallet",
        programId: new PublicKey("BXY7CPSCWkyTanQiwq2kHpC6nQWrpSwJYQbW7aihuGyG"),
        deployPath: "goki/target/deploy/smart_wallet.so"
      },
      {
        label: "partial_signer",
        programId: new PublicKey("5wmGZYQhfGLDdo1zUh2cUnbs8KjF2HZWwwt6VAkUQwpF"),
        deployPath: "target/deploy/partial_signer.so"
      },
      {
        label: "transaction_loader",
        programId: new PublicKey("8FjwT1Bbjaxx3uYhvMne4vKQsQvx2mP7fwYfw3EAuWzF"),
        deployPath: "target/deploy/transaction_loader.so"
      },
      {
        label: "spl_governance",
        programId: new PublicKey("GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw"),
        deployPath: "deps/spl_governance.so"
      }
    ],
    jsonRpcUrl: LOCALHOST,
    websocketUrl: '',
    commitment: 'singleGossip',
    ledgerDir: tmpLedgerDir(),
    resetLedger: true,
    verifyFees: false,
    detached: process.env.CI != null,
  },
  relay: {
    enabled: process.env.CI == null,
    killlRunningRelay: true,
  },
  storage: {
    enabled: process.env.CI == null,
    storageId: 'mock-storage',
    clearOnStart: true,
  },
}