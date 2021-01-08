/// <reference types="node" />
import { AccountInfo, PublicKey } from "@solana/web3.js";
import { ParsedAccountBase } from "../../contexts/accounts";
export declare const OrderBookParser: (id: PublicKey, acc: AccountInfo<Buffer>) => ParsedAccountBase;
export declare const DexMarketParser: (pubkey: PublicKey, acc: AccountInfo<Buffer>) => ParsedAccountBase;
