import BufferLayout from "buffer-layout";
import * as Layout from "../utils/layout";
import {
    Account,
    Connection,
    PublicKey,
    SystemProgram,
    SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY,
    TransactionInstruction
} from "@solana/web3.js";
import {LendingInstruction} from "../models/lending";
import {INIT_USER_ENTITY} from "../constants";

const initUserLendingLayout = BufferLayout.struct([
    BufferLayout.blob(73),
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
    connection:Connection,
    instructions: TransactionInstruction[],
    signers: Account[],
    payer:PublicKey,
    programId:PublicKey
) => {
    let userEntity:PublicKey;
    try{
        userEntity = new PublicKey(localStorage.getItem(INIT_USER_ENTITY) as string)
    } catch(e){
        console.log('user entity is invalid error -> ', e.message);
        userEntity = await createInitUserAccount(connection, instructions, payer, signers, programId);
        instructions.push(
            createInitEntityAccountInstructions(
                userEntity,
                programId
            )
        );

    }
    return userEntity;
}
