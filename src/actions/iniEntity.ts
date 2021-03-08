import BufferLayout from "buffer-layout";
import * as Layout from "../utils/layout";
import {
    Account,
    Connection,
    PublicKey,
    SystemProgram,
    SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, Transaction,
    TransactionInstruction
} from "@solana/web3.js";
import {LendingInstruction} from "../models/lending";
import {INIT_USER_ENTITY} from "../constants";
import {sendTransaction} from "../contexts/connection";

const initUserLendingLayout = BufferLayout.struct([
    BufferLayout.blob(105),
]);


export async function createInitUserAccount(
    connection: Connection,
    instructions: TransactionInstruction[],
    payer: PublicKey,
    signers: Account[],
    programId: PublicKey
) {

    const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
        initUserLendingLayout.span
    );

    const account = new Account();
    instructions.push(
        SystemProgram.createAccount({
            fromPubkey: payer,
            newAccountPubkey: account.publicKey,
            lamports: accountRentExempt,
            space: initUserLendingLayout.span,
            programId: programId,
        })
    );

    signers.push(account);

    return account.publicKey;
}

export const createInitEntityAccountInstructions = (
    userLendingDetailsAccount: PublicKey,
    programId: PublicKey
): TransactionInstruction => {
    const dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        Layout.uint64("publicKey"),
    ]);

    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode(
        {
            instruction: LendingInstruction.InitUser,
        },
        data
    );

    const keys = [
        {pubkey: userLendingDetailsAccount, isSigner: false, isWritable: true},
        {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
        {pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false}

    ];

    return new TransactionInstruction({
        keys,
        programId: programId,
        data,
    });
};
export const initUserEntity = async (
    connection: Connection,
    wallet: any,
    programId: PublicKey,
    notifyCallback?: (message: object) => void | any,
) => {
    const sendMessageCallback = notifyCallback ? notifyCallback : (message: object) => console.log(message)
    let userEntity: PublicKey;
    try {
        userEntity = new PublicKey(localStorage.getItem(INIT_USER_ENTITY) as string)
    } catch (e) {
        console.log('user entity is invalid error -> ', e.message);
        sendMessageCallback({
            message: "User entity initializing...",
            type: "warn",
            description: "Please review transactions to approve.",
        });
        const signers: Account[] = [];
        const instructions: TransactionInstruction[] = [];
        const cleanupInstructions: TransactionInstruction[] = [];
        userEntity = await createInitUserAccount(connection, instructions, wallet.publicKey, signers, programId);

        instructions.push(
            createInitEntityAccountInstructions(
                userEntity,
                programId
            )
        );

        try {
            const tx = await sendTransaction(
                connection,
                wallet,
                instructions.concat(cleanupInstructions),
                signers,
                true,
            );
            // save entity
            userEntity && localStorage.setItem(INIT_USER_ENTITY, userEntity.toBase58());

            sendMessageCallback({
                message: "User entity initialized.",
                type: "success",
                description: `Transaction - ${tx.slice(0, 4)}...${tx.slice(-4)}`,
            });
        } catch (e) {
            sendMessageCallback({
                message: "Error in user entity initialized. (refresh this page later)",
                type: "error",
                description: e.message,
            });
        }
    }
    return userEntity;
}
