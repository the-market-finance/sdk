/// <reference types="node" />
import { AccountInfo, PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import * as BufferLayout from "buffer-layout";
export declare const LendingReserveLayout: typeof BufferLayout.Structure;
export declare const isLendingReserve: (info: AccountInfo<Buffer>) => boolean;
export interface LendingReserve {
    lastUpdateSlot: BN;
    lendingMarket: PublicKey;
    liquiditySupply: PublicKey;
    liquidityMint: PublicKey;
    collateralSupply: PublicKey;
    collateralMint: PublicKey;
    dexMarketOption: number;
    dexMarket: PublicKey;
    config: {
        optimalUtilizationRate: number;
        loanToValueRatio: number;
        liquidationBonus: number;
        liquidationThreshold: number;
        minBorrowRate: number;
        optimalBorrowRate: number;
        maxBorrowRate: number;
    };
    cumulativeBorrowRateWad: BN;
    borrowedLiquidityWad: BN;
    availableLiquidity: BN;
    collateralMintSupply: BN;
}
export declare const LendingReserveParser: (pubKey: PublicKey, info: AccountInfo<Buffer>) => {
    pubkey: PublicKey;
    account: {
        executable: boolean;
        owner: PublicKey;
        lamports: number;
        data: Buffer;
        rentEpoch?: number | undefined;
    };
    info: any;
} | undefined;
export declare const initReserveInstruction: (liquidityAmount: number | BN, maxUtilizationRate: number, from: PublicKey, to: PublicKey, reserveAccount: PublicKey, liquidityMint: PublicKey, liquiditySupply: PublicKey, collateralMint: PublicKey, collateralSupply: PublicKey, lendingMarket: PublicKey, lendingMarketAuthority: PublicKey, dexMarket: PublicKey) => TransactionInstruction;
export declare const calculateUtilizationRatio: (reserve: LendingReserve) => number;
export declare const reserveMarketCap: (reserve?: LendingReserve | undefined) => number;
export declare const collateralExchangeRate: (reserve?: LendingReserve | undefined) => number;
export declare const collateralToLiquidity: (collateralAmount: BN | number, reserve?: LendingReserve | undefined) => number;
export declare const liquidityToCollateral: (liquidityAmount: BN | number, reserve?: LendingReserve | undefined) => number;
