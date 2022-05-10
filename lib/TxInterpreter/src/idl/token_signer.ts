export type TokenSigner = {
  "version": "0.10.4",
  "name": "token_signer",
  "instructions": [
    {
      "name": "invokeSignedInstruction",
      "accounts": [
        {
          "name": "ownerAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "nftAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftPda",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "GokiTokenSigner"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "nft_account.mint"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Unauthorized."
    }
  ]
};

export const IDL: TokenSigner = {
  "version": "0.10.4",
  "name": "token_signer",
  "instructions": [
    {
      "name": "invokeSignedInstruction",
      "accounts": [
        {
          "name": "ownerAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "nftAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftPda",
          "isMut": false,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "GokiTokenSigner"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "account": "TokenAccount",
                "path": "nft_account.mint"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Unauthorized."
    }
  ]
};
