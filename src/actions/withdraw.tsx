import {
    Account,
    Connection,
    PublicKey,
    TransactionInstruction,
} from "@solana/web3.js";
import {LendingReserve, withdrawInstruction} from "./../models/lending";
import {AccountLayout, Token} from "@solana/spl-token";
import {LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID} from "../constants/ids";
import {findOrCreateAccountByMint} from "./account";
import {TokenAccount} from "../models";
import {sendTransaction} from "../contexts/connection";

export const withdraw = async (
    from: TokenAccount, // CollateralAccount
    amountLamports: number, // in collateral token (lamports)
    reserve: LendingReserve,
    reserveAddress: PublicKey,
    connection: Connection,
    wallet: any,
    notifyCallback?: (message: object) => void | any
) => {
    const sendMessageCallback = notifyCallback ? notifyCallback : (message: object) => console.log(message)
    sendMessageCallback({
        message: "Withdrawing funds...",
        description: "Please review transactions to approve.",
        type: "warn",
    });

    // user from account
    const signers: Account[] = [];
    const instructions: TransactionInstruction[] = [];
    const cleanupInstructions: TransactionInstruction[] = [];

    const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
        AccountLayout.span
    );

    const [authority] = await PublicKey.findProgramAddress(
        [reserve.lendingMarket.toBuffer()],
        LENDING_PROGRAM_ID
    );

    const fromAccount = from.pubkey;

    // create approval for transfer transactions
    instructions.push(
        Token.createApproveInstruction(
            TOKEN_PROGRAM_ID,
            fromAccount,
            authority,
            wallet.publicKey,
            [],
            amountLamports
        )
    );

    // get destination account
    const toAccount = await findOrCreateAccountByMint(
        wallet.publicKey,
        wallet.publicKey,
        instructions,
        cleanupInstructions,
        accountRentExempt,
        reserve.liquidityMint,
        signers
    );

    instructions.push(
        withdrawInstruction(
            amountLamports,
            fromAccount,
            toAccount,
            reserveAddress,
            reserve.collateralMint,
            reserve.liquiditySupply,
            authority
        )
    );

    try {
        let tx = await sendTransaction(
            connection,
            wallet,
            instructions.concat(cleanupInstructions),
            signers,
            true,
            sendMessageCallback
        );

        sendMessageCallback({
            message: "Funds withdraw.",
            type: "success",
            description: `Transaction - ${tx.slice(0, 4)}...${tx.slice(-4)}`,
        });
    } catch {
        // TODO:
    }
};
