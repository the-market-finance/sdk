import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import { LendingReserve } from './reserve';
export declare const depositInstruction: (liquidityAmount: number | BN, from: PublicKey, to: PublicKey, reserveAuthority: PublicKey, reserveAccount: PublicKey, reserveSupply: PublicKey, collateralMint: PublicKey) => TransactionInstruction;
export declare const calculateDepositAPY: (reserve: LendingReserve) => number;
