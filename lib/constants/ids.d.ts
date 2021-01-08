import { PublicKey } from "@solana/web3.js";
export declare const WRAPPED_SOL_MINT: PublicKey;
export declare let TOKEN_PROGRAM_ID: PublicKey;
export declare let LENDING_PROGRAM_ID: PublicKey;
export declare const SWAP_PROGRAM_OWNER_FEE_ADDRESS: PublicKey;
export declare const SWAP_HOST_FEE_ADDRESS: PublicKey;
export declare const ENABLE_FEES_INPUT = false;
export declare const PROGRAM_IDS: {
    name: string;
    LENDING_PROGRAM_ID: PublicKey;
    swap: () => {
        current: {
            pubkey: PublicKey;
            layout: any;
        };
        legacy: PublicKey[];
    };
}[];
export declare const setProgramIds: (envName: string) => void;
export declare const programIds: () => {
    token: PublicKey;
    lending: PublicKey;
    swap: PublicKey;
    swapLayout: any;
    swap_legacy: PublicKey[];
};
