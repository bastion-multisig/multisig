import { SmartWalletContextState } from "@/contexts/SmartWalletContext";
import { DEFAULT_WALLET_DERIVED_INDEX } from "@/data/SolanaChains";
import {
  findSmartWallet,
  findSubaccountInfoAddress,
  findWalletDerivedAddress,
} from "@bastion-multisig/multisig-tx";
import { BN } from "@project-serum/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";

export async function createSmartWallet(
  { walletPubkey, program }: SmartWalletContextState,
  owners: PublicKey[],
  threshold: BN
) {
  if (!walletPubkey) {
    throw new Error("No wallet");
  }

  const maxOwners = owners.length;
  const minimumDelay = new BN(0);

  const smartWalletBase = Keypair.generate();

  const [smartWallet, smartWalletBump] = findSmartWallet(
    smartWalletBase.publicKey
  );

  const [treasury] = findWalletDerivedAddress(
    smartWallet,
    DEFAULT_WALLET_DERIVED_INDEX
  );

  let [subaccountInfo, subaccountInfoBump] =
    findSubaccountInfoAddress(treasury);

  await program.methods
    .createSmartWallet(
      smartWalletBump,
      maxOwners,
      owners,
      threshold,
      minimumDelay
    )
    .accounts({
      base: smartWalletBase.publicKey,
      smartWallet,
      payer: walletPubkey,
      systemProgram: SystemProgram.programId,
    })
    .postInstructions([
      await program.methods
        .createSubaccountInfo(
          subaccountInfoBump,
          treasury,
          smartWallet,
          DEFAULT_WALLET_DERIVED_INDEX,
          { derived: {} }
        )
        .accounts({
          subaccountInfo,
          payer: walletPubkey,
          systemProgram: SystemProgram.programId,
        })
        .instruction(),
    ])
    .signers([smartWalletBase])
    .rpc();
  return smartWallet;
}
