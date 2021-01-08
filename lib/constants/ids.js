import { PublicKey } from "@solana/web3.js";
import { TokenSwapLayout, TokenSwapLayoutV1 } from "../models/tokenSwap";
export var WRAPPED_SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
export var TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
export var LENDING_PROGRAM_ID = new PublicKey("FEgTndbNvdWKtXYaNnZQ9RD7EwzFy3AEhpkNbdRzFotF");
// swap data
var SWAP_PROGRAM_ID;
var SWAP_PROGRAM_LEGACY_IDS;
var SWAP_PROGRAM_LAYOUT;
export var SWAP_PROGRAM_OWNER_FEE_ADDRESS = new PublicKey("HfoTxFR1Tm6kGmWgYWD6J7YHVy1UwqSULUGVLXkJqaKN");
export var SWAP_HOST_FEE_ADDRESS = process.env.REACT_APP_SWAP_HOST_FEE_ADDRESS
    ? new PublicKey("" + process.env.REACT_APP_SWAP_HOST_FEE_ADDRESS)
    : SWAP_PROGRAM_OWNER_FEE_ADDRESS;
export var ENABLE_FEES_INPUT = false;
console.debug("Host address: " + (SWAP_HOST_FEE_ADDRESS === null || SWAP_HOST_FEE_ADDRESS === void 0 ? void 0 : SWAP_HOST_FEE_ADDRESS.toBase58()));
console.debug("Owner address: " + (SWAP_PROGRAM_OWNER_FEE_ADDRESS === null || SWAP_PROGRAM_OWNER_FEE_ADDRESS === void 0 ? void 0 : SWAP_PROGRAM_OWNER_FEE_ADDRESS.toBase58()));
// change PROGRAM IDS
export var PROGRAM_IDS = [
    {
        name: "mainnet-beta",
        LENDING_PROGRAM_ID: LENDING_PROGRAM_ID,
        swap: function () { return ({
            current: {
                pubkey: new PublicKey("9qvG1zUp8xF1Bi4m6UdRNby1BAAuaDrUxSpv4CmRRMjL"),
                layout: TokenSwapLayoutV1,
            },
            legacy: [
            // TODO: uncomment to enable legacy contract
            // new PublicKey("9qvG1zUp8xF1Bi4m6UdRNby1BAAuaDrUxSpv4CmRRMjL"),
            ],
        }); },
    },
    {
        name: "testnet",
        LENDING_PROGRAM_ID: LENDING_PROGRAM_ID,
        swap: function () { return ({
            current: {
                pubkey: new PublicKey("2n2dsFSgmPcZ8jkmBZLGUM2nzuFqcBGQ3JEEj6RJJcEg"),
                layout: TokenSwapLayoutV1,
            },
            legacy: [],
        }); },
    },
    {
        name: "devnet",
        LENDING_PROGRAM_ID: LENDING_PROGRAM_ID,
        swap: function () { return ({
            current: {
                pubkey: new PublicKey("6Cust2JhvweKLh4CVo1dt21s2PJ86uNGkziudpkNPaCj"),
                layout: TokenSwapLayout,
            },
            legacy: [new PublicKey("BSfTAcBdqmvX5iE2PW88WFNNp2DHhLUaBKk5WrnxVkcJ")],
        }); },
    },
    {
        name: "localnet",
        LENDING_PROGRAM_ID: LENDING_PROGRAM_ID,
        swap: function () { return ({
            current: {
                pubkey: new PublicKey("369YmCWHGxznT7GGBhcLZDRcRoGWmGKFWdmtiPy78yj7"),
                layout: TokenSwapLayoutV1,
            },
            legacy: [],
        }); },
    },
];
export var setProgramIds = function (envName) {
    var instance = PROGRAM_IDS.find(function (env) { return env.name === envName; });
    if (!instance) {
        return;
    }
    var swap = instance.swap();
    LENDING_PROGRAM_ID = instance.LENDING_PROGRAM_ID;
    SWAP_PROGRAM_ID = swap.current.pubkey;
    SWAP_PROGRAM_LAYOUT = swap.current.layout;
    SWAP_PROGRAM_LEGACY_IDS = swap.legacy;
};
export var programIds = function () {
    return {
        token: TOKEN_PROGRAM_ID,
        lending: LENDING_PROGRAM_ID,
        swap: SWAP_PROGRAM_ID,
        swapLayout: SWAP_PROGRAM_LAYOUT,
        swap_legacy: SWAP_PROGRAM_LEGACY_IDS,
    };
};
