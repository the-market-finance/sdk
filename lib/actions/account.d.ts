import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { TokenAccount } from '../models';
export declare function ensureSplAccount(instructions: TransactionInstruction[], cleanupInstructions: TransactionInstruction[], toCheck: TokenAccount, payer: PublicKey, amount: number, signers: Account[]): PublicKey;
export declare const DEFAULT_TEMP_MEM_SPACE = 65528;
export declare function createTempMemoryAccount(instructions: TransactionInstruction[], payer: PublicKey, signers: Account[], space?: number): PublicKey;
export declare function createUninitializedObligation(instructions: TransactionInstruction[], payer: PublicKey, amount: number, signers: Account[]): PublicKey;
export declare function createUninitializedMint(instructions: TransactionInstruction[], payer: PublicKey, amount: number, signers: Account[]): PublicKey;
export declare function createUninitializedAccount(instructions: TransactionInstruction[], payer: PublicKey, amount: number, signers: Account[]): PublicKey;
export declare function createTokenAccount(instructions: TransactionInstruction[], payer: PublicKey, accountRentExempt: number, mint: PublicKey, owner: PublicKey, signers: Account[]): PublicKey;
export declare function findOrCreateAccountByMint(payer: PublicKey, owner: PublicKey, instructions: TransactionInstruction[], cleanupInstructions: TransactionInstruction[], accountRentExempt: number, mint: PublicKey, // use to identify same type
signers: Account[], excluded?: Set<string>): PublicKey;
