import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
export declare const withdrawInstruction: (collateralAmount: number | BN, from: PublicKey, to: PublicKey, reserveAccount: PublicKey, collateralMint: PublicKey, reserveSupply: PublicKey, authority: PublicKey) => TransactionInstruction;
