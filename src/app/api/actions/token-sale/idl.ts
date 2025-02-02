export type TokenSale = {
    "version": "0.1.0",
    "name": "token_sale",
    "instructions": [
        {
            "name": "initialize",
            "accounts": [
                {
                    "name": "wlMetadata",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "wlMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "saleMetadata",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "saleMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vault",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "payer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenMetadataProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "metadata",
                    "type": {
                        "defined": "InitTokenParams"
                    }
                }
            ]
        },
        {
            "name": "requestWl",
            "accounts": [
                {
                    "name": "mint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "destination",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "payer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "associatedTokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "initializeLimitTracker",
            "accounts": [
                {
                    "name": "tracker",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "payer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "buyTokens",
            "accounts": [
                {
                    "name": "saleMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "wlMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "destination",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "wlAccount",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "vault",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tracker",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "payer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "associatedTokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "quantity",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "withdraw",
            "accounts": [
                {
                    "name": "vault",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "payer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "quantity",
                    "type": "u64"
                }
            ]
        }
    ],
    "accounts": [
        {
            "name": "vaultAccount",
            "type": {
                "kind": "struct",
                "fields": []
            }
        },
        {
            "name": "trackerAccount",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "count",
                        "type": "u64"
                    }
                ]
            }
        }
    ],
    "types": [
        {
            "name": "InitTokenParams",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "wlName",
                        "type": "string"
                    },
                    {
                        "name": "wlSymbol",
                        "type": "string"
                    },
                    {
                        "name": "wlUri",
                        "type": "string"
                    },
                    {
                        "name": "wlDecimals",
                        "type": "u8"
                    },
                    {
                        "name": "saleName",
                        "type": "string"
                    },
                    {
                        "name": "saleSymbol",
                        "type": "string"
                    },
                    {
                        "name": "saleUri",
                        "type": "string"
                    },
                    {
                        "name": "saleDecimals",
                        "type": "u8"
                    }
                ]
            }
        }
    ],
    "errors": [
        {
            "code": 6000,
            "name": "WlRequirementNotMet",
            "msg": "You don't have enough WL tokens"
        },
        {
            "code": 6001,
            "name": "BuyLimitReached",
            "msg": "You can't buy more tokens"
        }
    ]
}

export const IDL: TokenSale = {
    "version": "0.1.0",
    "name": "token_sale",
    "instructions": [
        {
            "name": "initialize",
            "accounts": [
                {
                    "name": "wlMetadata",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "wlMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "saleMetadata",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "saleMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vault",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "payer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenMetadataProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "metadata",
                    "type": {
                        "defined": "InitTokenParams"
                    }
                }
            ]
        },
        {
            "name": "requestWl",
            "accounts": [
                {
                    "name": "mint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "destination",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "payer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "associatedTokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "initializeLimitTracker",
            "accounts": [
                {
                    "name": "tracker",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "payer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "buyTokens",
            "accounts": [
                {
                    "name": "saleMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "wlMint",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "destination",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "wlAccount",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "vault",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tracker",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "payer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "associatedTokenProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "quantity",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "withdraw",
            "accounts": [
                {
                    "name": "vault",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "payer",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "rent",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "quantity",
                    "type": "u64"
                }
            ]
        }
    ],
    "accounts": [
        {
            "name": "vaultAccount",
            "type": {
                "kind": "struct",
                "fields": []
            }
        },
        {
            "name": "trackerAccount",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "count",
                        "type": "u64"
                    }
                ]
            }
        }
    ],
    "types": [
        {
            "name": "InitTokenParams",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "wlName",
                        "type": "string"
                    },
                    {
                        "name": "wlSymbol",
                        "type": "string"
                    },
                    {
                        "name": "wlUri",
                        "type": "string"
                    },
                    {
                        "name": "wlDecimals",
                        "type": "u8"
                    },
                    {
                        "name": "saleName",
                        "type": "string"
                    },
                    {
                        "name": "saleSymbol",
                        "type": "string"
                    },
                    {
                        "name": "saleUri",
                        "type": "string"
                    },
                    {
                        "name": "saleDecimals",
                        "type": "u8"
                    }
                ]
            }
        }
    ],
    "errors": [
        {
            "code": 6000,
            "name": "WlRequirementNotMet",
            "msg": "You don't have enough WL tokens"
        },
        {
            "code": 6001,
            "name": "BuyLimitReached",
            "msg": "You can't buy more tokens"
        }
    ]
}