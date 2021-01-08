import { Connection, PublicKey } from "@solana/web3.js";
export declare const deposit: (value: string, connection: Connection, wallet: any, address: string | PublicKey) => Promise<{
    message: string;
    type: string;
    description: string;
}>;
