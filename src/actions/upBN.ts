import {
    Account,
    Connection,
    PublicKey,
    SYSVAR_CLOCK_PUBKEY,
    TransactionInstruction
} from "@solana/web3.js";
import BufferLayout from "buffer-layout";
import {LendingInstruction} from "../models/lending";
import * as Layout from "../utils/layout";
import {sendTransaction} from "../contexts/connection";
import BN from "bn.js";
import {createTempMemoryAccount} from "./account";

export const updateBN = async (
    connection: Connection,
    wallet: any,
    reserve: PublicKey,
    dexMarket: PublicKey,
    dexMarketOrderBookSide: PublicKey,
    memory: PublicKey,
    userEntity: PublicKey,
    lendingMarketPk:PublicKey,
    bonusType: number,
    programId: PublicKey,
    notifyCallback?: (message: object) => void | any,
) => {
    const sendMessageCallback = notifyCallback ? notifyCallback : (message: object) => console.log(message)

    // user from account
    const signers: Account[] = [];
    const instructions: TransactionInstruction[] = [];
    const cleanupInstructions: TransactionInstruction[] = [];


    sendMessageCallback({
        message: "update of bonuses tokens...",
        description: "Please review transactions to approve.",
        type: "warn",
    });

    // const dexMarket1 = new PublicKey("7xMDbYTCqQEcK2aM9LbetGtNFJpzKdfXzLL5juaLh4GJ")
    // const dexMarketOrderBookSide1 = new PublicKey("9YxDzVYxB4FUXhqKLpW5Nu4LuYFVYnwgWghk9BNyYzEw")
    const memory1 = createTempMemoryAccount(
        instructions,
        wallet.publicKey,
        signers
    );

    // console.log('lendingMarketPk', lendingMarketPk.toBase58())


    instructions.push(
        updateBonusInstructions(
            reserve,
            dexMarket,
            dexMarketOrderBookSide,
            memory1,
            programId,
            userEntity,
            lendingMarketPk,
            bonusType
        )
    );

    try {
        let tx = await sendTransaction(
            connection,
            wallet,
            instructions.concat(cleanupInstructions),
            signers,
            true,
            (msg) => sendMessageCallback(msg)
        );

        sendMessageCallback({
            message: "updated bonuses success.",
            type: "success",
            description: `Transaction - ${tx.slice(0, 4)}...${tx.slice(-4)}`,
        });

    } catch (e) {
        sendMessageCallback({
            message: "Error in update of bonuses tokens. (refresh this page later)",
            type: "error",
            description: e.message,
        });
    }
    // return reserve
};


export const updateBonusInstructions = (
    reserve: PublicKey,
    dexMarket: PublicKey,
    dexMarketOrderBookSide: PublicKey,
    memory: PublicKey,
    programId: PublicKey,
    userEntity: PublicKey,
    lendingMarket:PublicKey,
    bonusType: number
): TransactionInstruction => {
    const dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        BufferLayout.u8("bonus_type"),
        // Layout.uint64("rate"),
    ]);


    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode(
        {
            instruction: LendingInstruction.UpdateBonus,
            bonus_type: bonusType,
            // rate: new BN(rate)
        },
        data
    );

    const keys = [
        {pubkey: reserve, isSigner: false, isWritable: true},
        {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
        {pubkey: dexMarket, isSigner: false, isWritable: false},
        {pubkey: dexMarketOrderBookSide, isSigner: false, isWritable: false},
        {pubkey: memory, isSigner: true, isWritable: true},
        {pubkey: userEntity, isSigner: false, isWritable: true},
        {pubkey: lendingMarket, isSigner: false, isWritable: true}
    ];

    return new TransactionInstruction({
        keys,
        programId: programId,
        data,
    });
};
