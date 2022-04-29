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
          "isSigner": false
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
  "types": [
    {
      "name": "ErrorCode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Unauthorized"
          }
        ]
      }
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
          "isSigner": false
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
  "types": [
    {
      "name": "ErrorCode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Unauthorized"
          }
        ]
      }
    }
  ]
};
