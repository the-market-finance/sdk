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
import {formatPct, fromLamports, wadToLamports} from "../utils/utils";
import {cache, MintParser, TokenAccountParser} from "../contexts/accounts";
import {getUserAccounts} from "./common";

/**
 * информационный запрос, выводящий текущую ставку по депозиту APY
 *
 * @param reserve:LendingReserve (можно получить через getReserveAccounts)
 * @return  string
 */
export const depositApyVal = (reserve: LendingReserve):string => {
    const totalBorrows = wadToLamports(reserve.borrowedLiquidityWad).toNumber();
    const currentUtilization =
        totalBorrows / (reserve.availableLiquidity.toNumber() + totalBorrows);

    const borrowAPY = calculateBorrowAPY(reserve);
    return formatPct.format(currentUtilization * borrowAPY);
};
/**
 * информационный запрос, выводящий текущую ставку по депозиту APY
 *
 * @param connection:Connection
 * @param publicKey: string | PublicKey
 * @return  Promise<string>
 * @async
 */
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


/**
 * создание депозита (deposit)
 *
 * @param value:string
 * @param reserve:LendingReserve (можно получить через getReserveAccounts(connection, address)[0].info)
 * @param reserveAddress:PublicKey (можно получить через getReserveAccounts(connection, address)[0].pubkey)
 * @param connection: Connection
 * @param wallet:Wallet
 * @param notifyCallback?: (message:object) => void | any (например функция notify из antd)
 * @return  void
 * @async
 */
export const deposit = async (
    value: string,
    reserve: LendingReserve,
    reserveAddress: PublicKey,
    connection: Connection,
    wallet: any,
    notifyCallback?: (message:object) => void | any
) => {
    const sendMessageCallback = notifyCallback ? notifyCallback : (message:object) => console.log(message)

    const accountsByOwner = await connection.getTokenAccountsByOwner(wallet?.publicKey, {
        programId: programIds().token,
    });


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

    // fetch from

    const userAccounts = await getUserAccounts(connection, wallet);

    const fromAccounts = userAccounts
        .filter(
            (acc) =>
                reserve.liquidityMint.equals(acc.info.mint)
        )
        .sort((a, b) => b.info.amount.sub(a.info.amount).toNumber());


    if (!fromAccounts.length){throw Error('from account not found.')}

    const from = fromAccounts[0];

    // fetch from end

    //get Lampots treatmend value

    const balanceLamports = fromAccounts.reduce(
        (res, item) => (res += item.info.amount.toNumber()),
        0
    );

    const MintId = reserve?.liquidityMint.toBase58()

    const mintInfo = await new Promise<any>((resolve,reject) =>{
        cache.query(connection, MintId, MintParser)
            .then((acc) => resolve(acc?.info as any))
            .catch((err) => reject(err));
    })

    const balance = fromLamports(balanceLamports, mintInfo);

    const amountLamports = Math.ceil(balanceLamports * (parseFloat(value) / balance))


    ///get Lampots treatmend value end

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
            signers,
            undefined,
            accountsByOwner.value ? accountsByOwner.value.map( a => TokenAccountParser(a.pubkey,a.account)) : undefined
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
    console.log('signers',signers)
    console.log('instructions.concat(cleanupInstructions)',instructions.concat(cleanupInstructions))

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



