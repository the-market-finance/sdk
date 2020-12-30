import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import { LendingReserve } from './reserve';
export declare enum BorrowAmountType {
    LiquidityBorrowAmount = 0,
    CollateralDepositAmount = 1
}
export declare const borrowInstruction: (amount: number | BN, amountType: BorrowAmountType, from: PublicKey, to: PublicKey, depositReserve: PublicKey, depositReserveCollateralSupply: PublicKey, borrowReserve: PublicKey, borrowReserveLiquiditySupply: PublicKey, obligation: PublicKey, obligationMint: PublicKey, obligationTokenOutput: PublicKey, obligationTokenOwner: PublicKey, lendingMarketAuthority: PublicKey, dexMarket: PublicKey, dexOrderBookSide: PublicKey, memory: PublicKey) => TransactionInstruction;
export declare const calculateBorrowAPY: (reserve: LendingReserve) => number;
