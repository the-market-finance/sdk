import { Connection } from "@solana/web3.js";
import { LendingReserve } from "../models/lending";
import { LendingObligation, TokenAccount } from "../models";
import { ParsedAccount } from "../contexts/accounts";
export declare const repay: (from: TokenAccount, amountLamports: number, obligation: ParsedAccount<LendingObligation>, obligationToken: TokenAccount, repayReserve: ParsedAccount<LendingReserve>, withdrawReserve: ParsedAccount<LendingReserve>, connection: Connection, wallet: any) => Promise<{
    message: string;
    type: string;
    description: string;
    full_description: string;
}>;
