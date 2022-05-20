import {
  findSmartWallet,
  findSubaccountInfoAddress,
  findWalletDerivedAddress,
} from "@multisig/multisig-tx";
import { BN } from "@project-serum/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { RpcContext } from "./../hooks/useRpcContext";

export async function createSmartWallet(
  { walletPubkey, program }: RpcContext,
  owners: PublicKey[],
  threshold: BN
) {
  if (!walletPubkey) {
    return;
  }

  const maxOwners = owners.length;
  const minimumDelay = new BN(0);
  const treasuryWalletIndex = 0;

  const smartWalletBase = Keypair.generate();

  const [smartWallet, smartWalletBump] = await findSmartWallet(
    smartWalletBase.publicKey
  );

  console.log(smartWallet);
  console.log(treasuryWalletIndex);
  console.log(smartWallet.toBuffer());
  console.log(new BN(treasuryWalletIndex));
  const [treasury] = await findWalletDerivedAddress(
    smartWallet,
    treasuryWalletIndex
  );

  let [subaccountInfo, subaccountInfoBump] = await findSubaccountInfoAddress(
    treasury
  );

  return program.methods
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
}
