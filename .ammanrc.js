const { LOCALHOST, tmpLedgerDir }  = require('@metaplex-foundation/amman');
const { PublicKey } = require('@solana/web3.js');

module.exports = {
  validator: {
    killRunningValidators: true,
    programs: [
      {
        label: "smart_wallet",
        programId: new PublicKey("BXY7CPSCWkyTanQiwq2kHpC6nQWrpSwJYQbW7aihuGyG"),
        deployPath: "deps/smart_wallet.so"
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