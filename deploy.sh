#!/bin/bash

echo "Mainnet balance $(solana balance -u m)" &&

#echo "transaction_loader devnet" &&
#solana program deploy --buffer buffer2.json target/deploy/transaction_loader.so -u d --program-id 8FjwT1Bbjaxx3uYhvMne4vKQsQvx2mP7fwYfw3EAuWzF &&
#echo "transaction_loader mainnet" &&
#solana program deploy --buffer buffer2.json target/deploy/transaction_loader.so -u m --program-id 8FjwT1Bbjaxx3uYhvMne4vKQsQvx2mP7fwYfw3EAuWzF &&

#echo "transaction_loader idl devnet" &&
#anchor idl upgrade -f target/idl/transaction_loader.json --provider.cluster devnet 8FjwT1Bbjaxx3uYhvMne4vKQsQvx2mP7fwYfw3EAuWzF &&
#echo "transaction_loader idl mainnet" &&
#anchor idl upgrade -f target/idl/transaction_loader.json --provider.cluster mainnet 8FjwT1Bbjaxx3uYhvMne4vKQsQvx2mP7fwYfw3EAuWzF &&

echo "partial_signer devnet" &&
solana program deploy --buffer buffer2.json target/deploy/partial_signer.so -u d --program-id 5wmGZYQhfGLDdo1zUh2cUnbs8KjF2HZWwwt6VAkUQwpF &&
#echo "partial_signer mainnet" &&
#solana program deploy --buffer buffer2.json target/deploy/partial_signer.so -u m --program-id 5wmGZYQhfGLDdo1zUh2cUnbs8KjF2HZWwwt6VAkUQwpF &&

echo "partial_signer idl devnet" &&
anchor idl upgrade -f target/idl/partial_signer.json --provider.cluster devnet 5wmGZYQhfGLDdo1zUh2cUnbs8KjF2HZWwwt6VAkUQwpF &&
#echo "partial_signer idl mainnet" &&
#anchor idl upgrade -f target/idl/partial_signer.json --provider.cluster mainnet 5wmGZYQhfGLDdo1zUh2cUnbs8KjF2HZWwwt6VAkUQwpF &&

echo "spl_governance devnet" &&
solana program deploy --buffer buffer3.json deps/spl_governance.so -u d --program-id AKHu557RhoSAaZRvUaehK1ejBch1xwgxwy19gMR2z4Hp &&
#echo "spl_governance mainnet" &&
#solana program deploy --buffer buffer3.json deps/spl_governance.so -u m --program-id AKHu557RhoSAaZRvUaehK1ejBch1xwgxwy19gMR2z4Hp &&

echo "Mainnet balance post deploy $(solana balance -u m)"
