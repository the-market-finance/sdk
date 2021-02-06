import { PublicKey } from "@solana/web3.js";
import {TokenSwapLayout, TokenSwapLayoutV1} from "../models/tokenSwap";

export const WRAPPED_SOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);
export let TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

export let LENDING_PROGRAM_ID = new PublicKey(
  "DPLbpc7kfP8epmag4U2BiQpiX4XKYPPZux1ACa6GeGha"
);

// swap data
let SWAP_PROGRAM_ID = new PublicKey("9qvG1zUp8xF1Bi4m6UdRNby1BAAuaDrUxSpv4CmRRMjL");
let SWAP_PROGRAM_LEGACY_IDS: Array<PublicKey> = [];
let SWAP_PROGRAM_LAYOUT = TokenSwapLayoutV1;

export const SWAP_PROGRAM_OWNER_FEE_ADDRESS = new PublicKey(
    "HfoTxFR1Tm6kGmWgYWD6J7YHVy1UwqSULUGVLXkJqaKN"
);

export const SWAP_HOST_FEE_ADDRESS = process.env.REACT_APP_SWAP_HOST_FEE_ADDRESS
    ? new PublicKey(`${process.env.REACT_APP_SWAP_HOST_FEE_ADDRESS}`)
    : SWAP_PROGRAM_OWNER_FEE_ADDRESS;

export const ENABLE_FEES_INPUT = false;

console.debug(`Host address: ${SWAP_HOST_FEE_ADDRESS?.toBase58()}`);
console.debug(`Owner address: ${SWAP_PROGRAM_OWNER_FEE_ADDRESS?.toBase58()}`);
// change PROGRAM IDS
export const PROGRAM_IDS = [
  {
    name: "mainnet-beta",
    LENDING_PROGRAM_ID : LENDING_PROGRAM_ID,
    swap: () => ({
      current: {
        pubkey: new PublicKey("9qvG1zUp8xF1Bi4m6UdRNby1BAAuaDrUxSpv4CmRRMjL"),
        layout: TokenSwapLayoutV1,
      },
      legacy: [
        // TODO: uncomment to enable legacy contract
        // new PublicKey("9qvG1zUp8xF1Bi4m6UdRNby1BAAuaDrUxSpv4CmRRMjL"),
      ],
    }),
  },
  {
    name: "testnet",
    LENDING_PROGRAM_ID : LENDING_PROGRAM_ID,
    swap: () => ({
      current: {
        pubkey: new PublicKey("2n2dsFSgmPcZ8jkmBZLGUM2nzuFqcBGQ3JEEj6RJJcEg"),
        layout: TokenSwapLayoutV1,
      },
      legacy: [],
    }),
  },
  {
    name: "devnet",
    LENDING_PROGRAM_ID : LENDING_PROGRAM_ID,
    swap: () => ({
      current: {
        pubkey: new PublicKey("6Cust2JhvweKLh4CVo1dt21s2PJ86uNGkziudpkNPaCj"),
        layout: TokenSwapLayout,
      },
      legacy: [new PublicKey("BSfTAcBdqmvX5iE2PW88WFNNp2DHhLUaBKk5WrnxVkcJ")],
    }),
  },
  {
    name: "localnet",
    LENDING_PROGRAM_ID : LENDING_PROGRAM_ID,
    swap: () => ({
      current: {
        pubkey: new PublicKey("369YmCWHGxznT7GGBhcLZDRcRoGWmGKFWdmtiPy78yj7"),
        layout: TokenSwapLayoutV1,
      },
      legacy: [],
    }),
  },
];



export const programIds = () => {
  return {
    token: TOKEN_PROGRAM_ID,
    lending: LENDING_PROGRAM_ID,
    swap: SWAP_PROGRAM_ID,
    swapLayout: SWAP_PROGRAM_LAYOUT,
    swap_legacy: SWAP_PROGRAM_LEGACY_IDS,
  };
};

