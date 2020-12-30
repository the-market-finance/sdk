/// <reference types="node" />
import { AccountInfo, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { AccountInfo as TokenAccountInfo } from '@solana/spl-token';
export interface TokenAccount {
    pubkey: PublicKey;
    account: AccountInfo<Buffer>;
    info: TokenAccountInfo;
}
export declare function approve(instructions: TransactionInstruction[], cleanupInstructions: TransactionInstruction[], account: PublicKey, delegate: PublicKey, owner: PublicKey, amount: number): void;
