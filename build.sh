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

cp target/types/partial_signer.ts lib/TxInterpreter/src/idl/partial_signer.ts

echo "Building lib"
(
    cd lib/TxInterpreter &&
    yarn build
) &&

echo "Building serum lib"
(
    cd ../serum-ts/packages/serum &&
    yarn build
) &&

echo "Building serum pool lib"
(
    cd ../serum-ts/packages/pool &&
    yarn build
)