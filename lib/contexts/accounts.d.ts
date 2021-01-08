/// <reference types="node" />
import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import { TokenAccount } from "../models";
import { EventEmitter } from "../utils/eventEmitter";
export interface ParsedAccountBase {
    pubkey: PublicKey;
    account: AccountInfo<Buffer>;
    info: any;
}
export declare type AccountParser = (pubkey: PublicKey, data: AccountInfo<Buffer>) => ParsedAccountBase | undefined;
export interface ParsedAccount<T> extends ParsedAccountBase {
    info: T;
}
export declare const MintParser: (pubKey: PublicKey, info: AccountInfo<Buffer>) => ParsedAccountBase;
export declare const TokenAccountParser: (pubKey: PublicKey, info: AccountInfo<Buffer>) => TokenAccount;
export declare const GenericAccountParser: (pubKey: PublicKey, info: AccountInfo<Buffer>) => ParsedAccountBase;
export declare const keyToAccountParser: Map<string, AccountParser>;
export declare const cache: {
    emitter: EventEmitter;
    query: (connection: Connection, pubKey: string | PublicKey, parser?: AccountParser | undefined) => Promise<ParsedAccountBase>;
    add: (id: PublicKey | string, obj: AccountInfo<Buffer>, parser?: AccountParser | undefined) => ParsedAccountBase | undefined;
    get: (pubKey: string | PublicKey) => ParsedAccountBase | undefined;
    byParser: (parser: AccountParser) => string[];
    registerParser: (pubkey: PublicKey | string, parser: AccountParser) => string | PublicKey;
};
export declare const precacheUserTokenAccounts: (connection: Connection, owner?: PublicKey | undefined) => Promise<void>;
export declare const getMultipleAccounts: (connection: any, keys: string[], commitment: string) => Promise<{
    keys: string[];
    array: AccountInfo<Buffer>[];
}>;
