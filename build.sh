#!/bin/bash

echo "Building spl_governance"
(
    cd ../solana-program-library/governance/program &&
    cargo build-bpf && 
    cd ../../ &&
    cp target/deploy/spl_governance.so ../multisig/deps/spl_governance.so
) &&

echo "Building transaction_loader, partial_signer"
anchor build &&

cp target/types/partial_signer.ts ../governance-ui/WalletConnect/idl/partial_signer.ts &&
cp target/types/transaction_loader.ts ../governance-ui/WalletConnect/idl/transaction_loader.ts