import { Account, Connection, TransactionInstruction } from "@solana/web3.js";
export declare type ENV = "mainnet-beta" | "testnet" | "devnet" | "localnet" | "lending";
export declare const ENDPOINTS: {
    name: ENV;
    endpoint: string;
}[];
export declare const sendTransaction: (connection: Connection, wallet: any, instructions: TransactionInstruction[], signers: Account[], awaitConfirmation?: boolean) => Promise<string>;
