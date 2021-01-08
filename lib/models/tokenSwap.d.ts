import { Numberu64 } from "@solana/spl-token-swap";
import { PublicKey, Account, TransactionInstruction } from "@solana/web3.js";
import * as BufferLayout from "buffer-layout";
import { PoolConfig } from "./pool";
export { TokenSwap } from "@solana/spl-token-swap";
/**
 * Layout for a public key
 */
export declare const publicKey: (property?: string) => Object;
/**
 * Layout for a 64bit unsigned value
 */
export declare const uint64: (property?: string) => Object;
export declare const TokenSwapLayoutLegacyV0: any;
export declare const TokenSwapLayoutV1: typeof BufferLayout.Structure;
export declare const TokenSwapLayout: typeof BufferLayout.Structure;
export declare const createInitSwapInstruction: (tokenSwapAccount: Account, authority: PublicKey, tokenAccountA: PublicKey, tokenAccountB: PublicKey, tokenPool: PublicKey, feeAccount: PublicKey, destinationAccount: PublicKey, tokenProgramId: PublicKey, swapProgramId: PublicKey, nonce: number, config: PoolConfig) => TransactionInstruction;
export declare const depositInstruction: (tokenSwap: PublicKey, authority: PublicKey, sourceA: PublicKey, sourceB: PublicKey, intoA: PublicKey, intoB: PublicKey, poolToken: PublicKey, poolAccount: PublicKey, swapProgramId: PublicKey, tokenProgramId: PublicKey, poolTokenAmount: number | Numberu64, maximumTokenA: number | Numberu64, maximumTokenB: number | Numberu64) => TransactionInstruction;
export declare const depositExactOneInstruction: (tokenSwap: PublicKey, authority: PublicKey, source: PublicKey, intoA: PublicKey, intoB: PublicKey, poolToken: PublicKey, poolAccount: PublicKey, swapProgramId: PublicKey, tokenProgramId: PublicKey, sourceTokenAmount: number | Numberu64, minimumPoolTokenAmount: number | Numberu64) => TransactionInstruction;
export declare const withdrawInstruction: (tokenSwap: PublicKey, authority: PublicKey, poolMint: PublicKey, feeAccount: PublicKey | undefined, sourcePoolAccount: PublicKey, fromA: PublicKey, fromB: PublicKey, userAccountA: PublicKey, userAccountB: PublicKey, swapProgramId: PublicKey, tokenProgramId: PublicKey, poolTokenAmount: number | Numberu64, minimumTokenA: number | Numberu64, minimumTokenB: number | Numberu64) => TransactionInstruction;
export declare const withdrawExactOneInstruction: (tokenSwap: PublicKey, authority: PublicKey, poolMint: PublicKey, sourcePoolAccount: PublicKey, fromA: PublicKey, fromB: PublicKey, userAccount: PublicKey, feeAccount: PublicKey | undefined, swapProgramId: PublicKey, tokenProgramId: PublicKey, sourceTokenAmount: number | Numberu64, maximumTokenAmount: number | Numberu64) => TransactionInstruction;
export declare const swapInstruction: (tokenSwap: PublicKey, authority: PublicKey, userSource: PublicKey, poolSource: PublicKey, poolDestination: PublicKey, userDestination: PublicKey, poolMint: PublicKey, feeAccount: PublicKey, swapProgramId: PublicKey, tokenProgramId: PublicKey, amountIn: number | Numberu64, minimumAmountOut: number | Numberu64, programOwner?: PublicKey | undefined) => TransactionInstruction;
