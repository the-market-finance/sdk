/// <reference types="node" />
import { AccountInfo, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import * as BufferLayout from "buffer-layout";
export declare const LendingObligationLayout: typeof BufferLayout.Structure;
export declare const isLendingObligation: (info: AccountInfo<Buffer>) => boolean;
export interface LendingObligation {
    lastUpdateSlot: BN;
    depositedCollateral: BN;
    collateralReserve: PublicKey;
    cumulativeBorrowRateWad: BN;
    borrowAmountWad: BN;
    borrowReserve: PublicKey;
    tokenMint: PublicKey;
}
export declare const LendingObligationParser: (pubKey: PublicKey, info: AccountInfo<Buffer>) => {
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
