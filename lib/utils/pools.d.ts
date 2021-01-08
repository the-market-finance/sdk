import { Connection, PublicKey } from "@solana/web3.js";
import { LiquidityComponent, PoolInfo, TokenAccount, PoolConfig } from "../models";
export declare const LIQUIDITY_PROVIDER_FEE = 0.003;
export declare const SERUM_FEE = 0.0005;
export declare const removeLiquidity: (connection: Connection, wallet: any, liquidityAmount: number, account: TokenAccount, pool?: PoolInfo | undefined) => Promise<PublicKey[]>;
export declare const removeExactOneLiquidity: (connection: Connection, wallet: any, account: TokenAccount, liquidityAmount: number, tokenAmount: number, tokenMint: string, pool?: PoolInfo | undefined) => Promise<PublicKey>;
export declare const swap: (connection: Connection, wallet: any, components: LiquidityComponent[], SLIPPAGE: number, pool?: PoolInfo | undefined) => Promise<void>;
export declare const addLiquidity: (connection: Connection, wallet: any, components: LiquidityComponent[], slippage: number, pool?: PoolInfo | undefined, options?: PoolConfig | undefined, depositType?: string) => Promise<void>;
export declare enum PoolOperation {
    Add = 0,
    SwapGivenInput = 1,
    SwapGivenProceeds = 2
}
export declare function calculateDependentAmount(connection: Connection, independent: string, amount: number, pool: PoolInfo, op: PoolOperation): Promise<number | string | undefined>;
