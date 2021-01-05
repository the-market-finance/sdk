import { PublicKey } from '@solana/web3.js';
export declare const WRAPPED_SOL_MINT: PublicKey;
export declare let TOKEN_PROGRAM_ID: PublicKey;
export declare let LENDING_PROGRAM_ID: PublicKey;
export declare const programIds: () => {
    token: PublicKey;
    lending: PublicKey;
};
