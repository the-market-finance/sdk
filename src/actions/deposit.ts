import {
    Account,
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
import {AccountLayout} from "@solana/spl-token";
import {
    createTempMemoryAccount,
    createUninitializedAccount,
    ensureSplAccount,
    findOrCreateAccountByMint,
} from "./account";
import {approve} from "../models";
import {sendTransaction} from "../contexts/connection";
import {formatPct, fromLamports, wadToLamports} from "../utils/utils";
import {cache, MintParser} from "../contexts/accounts";
import {getReserveAccounts, getUserAccounts} from "./common";
import {DexMarketParser} from "../models/dex";
import {initUserEntity} from "./iniEntity";

/**
 * information request displaying the current rate on the APY deposit
 *
 * @param reserve: LendingReserve (can be obtained via getReserveAccounts)
 * @return string
 */
export const depositApyVal = (reserve: LendingReserve):string => {
    const totalBorrows = wadToLamports(reserve.borrowedLiquidityWad).toNumber();
    const currentUtilization =
        totalBorrows / (reserve.availableLiquidity.toNumber() + totalBorrows);

    const borrowAPY = calculateBorrowAPY(reserve);
    return formatPct.format(currentUtilization * borrowAPY);
};
/**
 * information request displaying the current rate on the APY deposit
 *
 * @param connection: Connection
 * @param publicKey: string | PublicKey (token address)
 * @param programId: PublicKey (lending program id)
 * @return Promise<string>
 * @async
 */
export const getDepositApy = async (connection: Connection, publicKey: string | PublicKey, programId: PublicKey):Promise<string> => {
    const pk = typeof publicKey === "string" ? publicKey : publicKey?.toBase58();
    const programAccounts = await connection.getProgramAccounts(
        programId
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
 * creation of a deposit (deposit)
 *
 * @param value: string
 * @param reserve: LendingReserve (can be obtained through getReserveAccounts(connection, address)[0].info)
 * @param reserveAddress: PublicKey (can be obtained through getReserveAccounts(connection, address)[0].pubkey)
 * @param connection: Connection
 * @param wallet: Wallet
 * @param programId: PublicKey (lending program id)
 * @param notifyCallback?: (message:object) => void | any (e.g. the notify function from antd)
 * @param marketMintAddress?: string?: string (our market custom token address)
 * @param marketMintAccountAddress?:string (our mint account address)
 * @return void
 * @async
 */
export const deposit = async (
    value: string,
    reserve: LendingReserve,
    reserveAddress: PublicKey,
    connection: Connection,
    wallet: any,
    programId: PublicKey,
    notifyCallback?: (message:object) => void | any,
    marketMintAddress?: string,
    marketMintAccountAddress?:string,
) => {
    const sendMessageCallback = notifyCallback ? notifyCallback : (message:object) => console.log(message)

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
        programId
    );

    // lending detail init entity
    const userEntity = (marketMintAddress && marketMintAccountAddress)
        ? await initUserEntity(connection, wallet, programId, notifyCallback)
        : undefined
    // lending detail init entity end
    sendMessageCallback({
        message: "Depositing funds...",
        description: "Please review transactions to approve.",
        type: "warn",
    });
    const fromAccount = ensureSplAccount(
        instructions,
        cleanupInstructions,
        from,
        wallet.publicKey,
        amountLamports + accountRentExempt,
        signers
    );

    // create approval for transfer transactions
    approve(
        instructions,
        cleanupInstructions,
        fromAccount,
        authority,
        wallet.publicKey,
        amountLamports
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
            userAccounts || undefined
        );
    } else {
        toAccount = createUninitializedAccount(
            instructions,
            wallet.publicKey,
            accountRentExempt,
            signers
        );
    }
    // fetch market token Account
    const marketReserve =  marketMintAccountAddress ? (await getReserveAccounts(connection, programId, marketMintAccountAddress)).pop() : undefined;

    // fetch our mint token account
    const ourMintDepositAccount = marketMintAddress ? await findOrCreateAccountByMint(
        wallet.publicKey,
        wallet.publicKey,
        instructions,
        cleanupInstructions,
        accountRentExempt,
        new PublicKey(marketMintAddress),
        signers,
        undefined,
        userAccounts || undefined
    ) : undefined


    const [marketAuthority] = await PublicKey.findProgramAddress(
        marketReserve?.info ? [ marketReserve.info.lendingMarket.toBuffer()] : [], // which account should be authority for market
        programId
    );

    //fetch dex market area
    const dexMarketAddress = reserve.dexMarket


    const dexMarket = await cache.query(connection, dexMarketAddress, DexMarketParser);

    if (!dexMarket) {
        throw new Error(`Dex market doesn't exist.`);
    }

    const dexOrderBookSide = dexMarket?.info.asks;

    const memory = createTempMemoryAccount(
        instructions,
        wallet.publicKey,
        signers
    );

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
                reserve.collateralMint,
                programId,
                ourMintDepositAccount,
                marketReserve?.info.liquiditySupply,
                marketAuthority,
                marketReserve?.pubkey,
                dexMarket.pubkey,
                dexOrderBookSide,
                memory,
                userEntity
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
                reserve.dexMarket,
                programId
            )
        );
    }

    let tx = await sendTransaction(
        connection,
        wallet,
        instructions.concat(cleanupInstructions),
        signers,
        true,
        sendMessageCallback
    );

    sendMessageCallback({
        message: "Funds deposited.",
        type: "success",
        description: `Transaction - ${tx.slice(0,4)}...${tx.slice(-4)}`,
    });
};



