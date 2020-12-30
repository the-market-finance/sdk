import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
export declare const repayInstruction: (liquidityAmount: number | BN, from: PublicKey, to: PublicKey, repayReserveAccount: PublicKey, repayReserveLiquiditySupply: PublicKey, withdrawReserve: PublicKey, withdrawReserveCollateralSupply: PublicKey, obligation: PublicKey, obligationMint: PublicKey, obligationInput: PublicKey, authority: PublicKey) => TransactionInstruction;
