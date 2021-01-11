import {
    Account, AccountInfo,
    Connection,
    PublicKey,
    TransactionInstruction,
} from "@solana/web3.js";

import {
    calculateBorrowAPY,
    calculateDepositAPY,
    depositInstruction,
    initReserveInstruction, isLendingReserve, LendingReserve, LendingReserveParser,
} from "../models/lending";
import {AccountLayout, Token} from "@solana/spl-token";
import {LENDING_PROGRAM_ID, programIds, TOKEN_PROGRAM_ID} from "../constants";
import {
    createUninitializedAccount,
    ensureSplAccount,
    findOrCreateAccountByMint,
} from "./account";
import {TokenAccount} from "../models";
import {sendTransaction} from "../contexts/connection";
import {formatPct, wadToLamports} from "../utils/utils";

export const depositApyVal = (reserve: LendingReserve):string => {
    const totalBorrows = wadToLamports(reserve.borrowedLiquidityWad).toNumber();
    const currentUtilization =
        totalBorrows / (reserve.availableLiquidity.toNumber() + totalBorrows);

    const borrowAPY = calculateBorrowAPY(reserve);
    return formatPct.format(currentUtilization * borrowAPY);
};

export const getDepositApy = async (connection: Connection, publicKey: string | PublicKey):Promise<string> => {
    const pk = typeof publicKey === "string" ? publicKey : publicKey?.toBase58();
    const programAccounts = await connection.getProgramAccounts(
        LENDING_PROGRAM_ID
    );
    const lendingReserveAccount =
        programAccounts
            .filter(item =>
                isLendingReserve(item.account))
            .map((acc) =>
                LendingReserveParser(acc.pubkey, acc.account)).filter(acc => acc?.pubkey.toBase58() === pk)

    if (!lendingReserveAccount || lendingReserveAccount.length === 0) return '--';

    const apy = calculateDepositAPY(lendingReserveAccount[0]?.info);

    return formatPct.format(apy)
}

export const deposit = async (
    from: TokenAccount,
    amountLamports: number,
    reserve: LendingReserve,
    reserveAddress: PublicKey,
    connection: Connection,
    wallet: any,
    notifyCallback?: (message:object) => void | any
) => {
    const sendMessageCallback = notifyCallback ? notifyCallback : (message:object) => console.log(message)

    sendMessageCallback({
        message: "Depositing funds...",
        description: "Please review transactions to approve.",
        type: "warn",
    });

    const isInitalized = true; // TODO: finish reserve init

    // user from account
    const signers: Account[] = [];
    const instructions: TransactionInstruction[] = [];
    const cleanupInstructions: TransactionInstruction[] = [];

    const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
        AccountLayout.span
    );

    const [authority] = await PublicKey.findProgramAddress(
        [reserve.lendingMarket.toBuffer()], // which account should be authority
        LENDING_PROGRAM_ID
    );

    const fromAccount = ensureSplAccount(
        instructions,
        cleanupInstructions,
        from,
        wallet.publicKey,
        amountLamports + accountRentExempt,
        signers
    );

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

    let toAccount: PublicKey;
    if (isInitalized) {
        // get destination account
        toAccount = await findOrCreateAccountByMint(
            wallet.publicKey,
            wallet.publicKey,
            instructions,
            cleanupInstructions,
            accountRentExempt,
            reserve.collateralMint,
            signers
        );
    } else {
        toAccount = createUninitializedAccount(
            instructions,
            wallet.publicKey,
            accountRentExempt,
            signers
        );
    }

    if (isInitalized) {
        // deposit
        instructions.push(
            depositInstruction(
                amountLamports,
                fromAccount,
                toAccount,
                authority,
                reserveAddress,
                reserve.liquiditySupply,
                reserve.collateralMint
            )
        );
    } else {
        // TODO: finish reserve init
        const MAX_UTILIZATION_RATE = 80;
        instructions.push(
            initReserveInstruction(
                amountLamports,
                MAX_UTILIZATION_RATE,
                fromAccount,
                toAccount,
                reserveAddress,
                reserve.liquidityMint,
                reserve.liquiditySupply,
                reserve.collateralMint,
                reserve.collateralSupply,
                reserve.lendingMarket,
                authority,
                reserve.dexMarket
            )
        );
    }

    try {
        let tx = await sendTransaction(
            connection,
            wallet,
            instructions.concat(cleanupInstructions),
            signers,
            true,
            sendMessageCallback
        );

        return sendMessageCallback({
            message: "Funds deposited.",
            type: "success",
            description: `Transaction - ${tx.slice(0,4)}...${tx.slice(-4)}`,
        });
    } catch {
        // TODO:
        throw new Error();
    }
};

