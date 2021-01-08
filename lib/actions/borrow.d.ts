import { Connection, PublicKey } from "@solana/web3.js";
import { LendingReserve } from "../models/lending";
import { ParsedAccount } from "../contexts/accounts";
import { TokenAccount, BorrowAmountType, LendingObligation } from "../models";
export declare const borrow: (connection: Connection, wallet: any, from: TokenAccount, amount: number, amountType: BorrowAmountType, borrowReserve: ParsedAccount<LendingReserve>, depositReserve: ParsedAccount<LendingReserve>, existingObligation?: ParsedAccount<LendingObligation> | undefined, obligationAccount?: PublicKey | undefined) => Promise<{
    message: string;
    type: string;
    description: string;
    full_description: string;
}>;
