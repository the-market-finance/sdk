import { PublicKey } from "@solana/web3.js";
import {TokenSwapLayoutV1} from "../models/tokenSwap";

export const WRAPPED_SOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);
export let TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
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


export const programIds = () => {
  return {
    token: TOKEN_PROGRAM_ID,
    swap: SWAP_PROGRAM_ID,
    swapLayout: SWAP_PROGRAM_LAYOUT,
    swap_legacy: SWAP_PROGRAM_LEGACY_IDS,
  };
};

