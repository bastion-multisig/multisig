import { SmartWalletContextState } from "@/contexts/SmartWalletContext";
import {
  findSmartWallet,
  findSubaccountInfoAddress,
  findWalletDerivedAddress,
} from "@multisig/multisig-tx";
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
  const treasuryWalletIndex = 0;

  const smartWalletBase = Keypair.generate();

  const [smartWallet, smartWalletBump] = await findSmartWallet(
    smartWalletBase.publicKey
  );

  const [treasury] = await findWalletDerivedAddress(
    smartWallet,
    treasuryWalletIndex
  );

  let [subaccountInfo, subaccountInfoBump] = await findSubaccountInfoAddress(
    treasury
  );

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
          new BN(treasuryWalletIndex),
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
