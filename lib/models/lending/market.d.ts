/// <reference types="node" />
import { AccountInfo, PublicKey } from "@solana/web3.js";
import * as BufferLayout from "buffer-layout";
export declare const LendingMarketLayout: typeof BufferLayout.Structure;
export interface LendingMarket {
    isInitialized: boolean;
    quoteMint: PublicKey;
}
export declare const isLendingMarket: (info: AccountInfo<Buffer>) => boolean;
export declare const LendingMarketParser: (pubKey: PublicKey, info: AccountInfo<Buffer>) => {
    pubkey: PublicKey;
    account: {
        executable: boolean;
        owner: PublicKey;
        lamports: number;
        data: Buffer;
        rentEpoch?: number | undefined;
    };
    info: any;
};
