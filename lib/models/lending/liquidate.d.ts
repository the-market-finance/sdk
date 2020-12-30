import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
export declare const liquidateInstruction: (liquidityAmount: number | BN, from: PublicKey, to: PublicKey, repayReserveAccount: PublicKey, repayReserveLiquiditySupply: PublicKey, withdrawReserve: PublicKey, withdrawReserveCollateralSupply: PublicKey, obligation: PublicKey, authority: PublicKey, dexMarket: PublicKey, dexOrderBookSide: PublicKey, memory: PublicKey) => TransactionInstruction;
