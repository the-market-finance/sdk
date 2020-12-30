import { Connection, PublicKey } from '@solana/web3.js';
import { LendingReserve } from './../models/lending';
import { TokenAccount } from '../models';
export declare const deposit: (from: TokenAccount, amountLamports: number, reserve: LendingReserve, reserveAddress: PublicKey, connection: Connection, wallet: any) => Promise<{
    message: string;
    type: string;
    description: string;
}>;
