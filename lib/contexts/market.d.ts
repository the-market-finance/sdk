import { PublicKey } from "@solana/web3.js";
import { LendingReserve } from "../models";
export declare const simulateMarketOrderFill: (amount: number, reserve: LendingReserve, dex: PublicKey) => number;
