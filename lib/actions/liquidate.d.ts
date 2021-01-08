import { Connection } from "@solana/web3.js";
import { LendingReserve } from "../models/lending";
import { LendingObligation, TokenAccount } from "../models";
import { ParsedAccount } from "../contexts/accounts";
export declare const liquidate: (connection: Connection, wallet: any, from: TokenAccount, amountLamports: number, obligation: ParsedAccount<LendingObligation>, repayReserve: ParsedAccount<LendingReserve>, withdrawReserve: ParsedAccount<LendingReserve>) => Promise<{
    message: string;
    type: string;
    description: string;
    full_description: string;
}>;
