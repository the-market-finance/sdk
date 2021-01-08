import { MintInfo } from "@solana/spl-token";
import { PoolInfo, TokenAccount } from "../models";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
export interface KnownToken {
    tokenSymbol: string;
    tokenName: string;
    icon: string;
    mintAddress: string;
}
export declare function getPoolName(map: KnownTokenMap, pool: PoolInfo, shorten?: boolean): string;
export declare function convert(account?: TokenAccount | number, mint?: MintInfo, rate?: number): number;
export declare type KnownTokenMap = Map<string, KnownToken>;
export declare function shortenAddress(address: string, chars?: number): string;
export declare function getTokenNameSW(map: KnownTokenMap, mintAddress: string, shorten?: boolean, length?: number): string;
export declare function getTokenName(map: KnownTokenMap, mint?: string | PublicKey, shorten?: boolean): string;
export declare function getTokenIcon(map: KnownTokenMap, mintAddress?: string | PublicKey): string | undefined;
export declare function isKnownMint(map: KnownTokenMap, mintAddress: string): boolean;
export declare const STABLE_COINS: Set<string>;
export declare function chunks<T>(array: T[], size: number): T[][];
export declare function toLamports(account?: TokenAccount | number, mint?: MintInfo): number;
export declare function wadToLamports(amount?: BN): BN;
export declare function fromLamports(account?: TokenAccount | number | BN, mint?: MintInfo, rate?: number): number;
export declare function formatTokenAmount(account?: TokenAccount, mint?: MintInfo, rate?: number, prefix?: string, suffix?: string, precision?: number, abbr?: boolean): string;
export declare const formatUSD: Intl.NumberFormat;
export declare const formatNumber: {
    format: (val?: number | undefined) => string;
};
export declare const formatPct: Intl.NumberFormat;
