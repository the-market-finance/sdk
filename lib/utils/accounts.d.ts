/// <reference types="node" />
import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import { MintInfo } from "@solana/spl-token";
import { TokenAccount } from "../models";
export interface ParsedAccountBase {
    pubkey: PublicKey;
    account: AccountInfo<Buffer>;
    info: any;
}
export interface ParsedAccount<T> extends ParsedAccountBase {
    info: T;
}
export declare type AccountParser = (pubkey: PublicKey, data: AccountInfo<Buffer>) => ParsedAccountBase;
export declare const MintParser: (pubKey: PublicKey, info: AccountInfo<Buffer>) => ParsedAccountBase;
export declare const TokenAccountParser: typeof tokenAccountFactory;
export declare const GenericAccountParser: (pubKey: PublicKey, info: AccountInfo<Buffer>) => ParsedAccountBase;
export declare const keyToAccountParser: Map<string, AccountParser>;
export declare const cache: {
    query: (connection: Connection, pubKey: string | PublicKey, parser?: AccountParser | undefined) => Promise<ParsedAccountBase>;
    add: (id: PublicKey, obj: AccountInfo<Buffer>, parser?: AccountParser | undefined) => ParsedAccountBase;
    get: (pubKey: string | PublicKey) => ParsedAccountBase | undefined;
    registerParser: (pubkey: PublicKey, parser: AccountParser) => void;
    queryAccount: (connection: Connection, pubKey: string | PublicKey) => Promise<TokenAccount>;
    addAccount: (pubKey: PublicKey, obj: AccountInfo<Buffer>) => TokenAccount;
    deleteAccount: (pubkey: PublicKey) => void;
    getAccount: (pubKey: string | PublicKey) => TokenAccount | undefined;
    queryMint: (connection: Connection, pubKey: string | PublicKey) => Promise<MintInfo>;
    getMint: (pubKey: string | PublicKey) => MintInfo | undefined;
    addMint: (pubKey: PublicKey, obj: AccountInfo<Buffer>) => MintInfo;
};
export declare const getCachedAccount: (predicate: (account: TokenAccount) => boolean) => TokenAccount | undefined;
declare function tokenAccountFactory(pubKey: PublicKey, info: AccountInfo<Buffer>): TokenAccount;
export declare const getMultipleAccounts: (connection: any, keys: string[], commitment: string) => Promise<{
    keys: string[];
    array: AccountInfo<Buffer>[];
}>;
export {};
