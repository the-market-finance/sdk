import {LENDING_PROGRAM_ID, programIds} from "../constants";
import {
    calculateBorrowAPY,
    isLendingObligation,
    isLendingReserve, LendingObligationParser,
    LendingReserve,
    LendingReserveParser
} from "../models/lending";
import {Connection, PublicKey} from "@solana/web3.js";
import {ParsedAccount, TokenAccountParser} from "../contexts/accounts";
import {TokenAccount} from "../models";

/**
 * Получение аккаунтов по лендингу для операций deposit, borrow.
 *
 * @param connection:Connection
 * (необязательный, передаётся для получение одного аккаунта по этому адресу, тоесть массив из 1 елемента)
 * @param address?: string | PublicKey
 * @return  Promise<ParsedAccount<LendingReserve>[]>
 * @async
 */
export const getReserveAccounts = async (connection: Connection, address?: string | PublicKey):Promise<ParsedAccount<LendingReserve>[]> => {
    const id = typeof address === "string" ? address : address?.toBase58();
    const programAccounts = await connection.getProgramAccounts(
        LENDING_PROGRAM_ID
    );
    const lendingReserveAccounts = programAccounts
        .filter(item =>
            isLendingReserve(item.account))
        .map((acc) =>
            LendingReserveParser(acc.pubkey, acc.account)).filter( acc => acc !== undefined
        ) as ParsedAccount<LendingReserve>[]

    return !id ? lendingReserveAccounts : lendingReserveAccounts.filter(acc => acc?.pubkey.toBase58() === id)
}
/**
 * Получение распарсенных токенов депозитов по лендингу, для операций (deposit, withdraw)
 *
 * @param connection:Connection
 * @param wallet: Wallet
 * (необязательный, передаётся для получение одного аккаунта по этому адресу, тоесть массив из 1 елемента)
 * @param address?: string | PublicKey
 * @return  Promise<ParsedAccount<TokenAccount>[]>
 * @async
 */
export const getUserDeposit = async (connection: Connection, wallet:any, address?: string | PublicKey ) => {

    const id = typeof address === "string" ? address : address?.toBase58();

    const reserveAccounts = await getReserveAccounts(connection);

    const accountsbyOwner = await connection.getTokenAccountsByOwner(wallet?.publicKey, {
        programId: programIds().token,
    });

    const reservesByCollateralMint = reserveAccounts.reduce((result, item) => {
        result.set(item.info.collateralMint.toBase58(), item);
        return result;
    }, new Map<string, ParsedAccount<LendingReserve>>());


    const prepareUserAccounts = accountsbyOwner.value.map(r => TokenAccountParser(r.pubkey, r.account));

    const selectUserAccounts = prepareUserAccounts
        .filter(
            (a) => a && a.info.owner.toBase58() === wallet.publicKey?.toBase58()
        )
        .map((a) => a as TokenAccount);

    const userAccounts = selectUserAccounts.filter(
        (a) => a !== undefined
    ) as TokenAccount[];

    const userDepositAccounts = userAccounts
        .filter((acc) => reservesByCollateralMint.has(acc.info.mint.toBase58()))
        .map((item) => ({
            account: item,
            reserve: reservesByCollateralMint.get(
                item.info.mint.toBase58()
            ) as ParsedAccount<LendingReserve>,
        }));

    return !id ? userDepositAccounts : await getReserveAccounts(connection, id);
}
/**
 * Получение облигаций с аккаунтом пользователя , для операций repay
 *
 * @param connection:Connection
 * @param wallet: Wallet
 * (необязательный, передаётся для получение одного аккаунта по этому адрессу, тоесть массив из 1 елемента)
 * @param address?: string | PublicKey
 * @return  Promise<{obligation:any, userAccounts:any}[]>
 * @async
 */
export const getUserObligations = async (connection: Connection, wallet:any,address?: string | PublicKey) => {
    const id = typeof address === "string" ? address : address?.toBase58();
    const programAccounts = await connection.getProgramAccounts(
        LENDING_PROGRAM_ID
    );
    const accountsbyOwner = await connection.getTokenAccountsByOwner(wallet?.publicKey, {
        programId: programIds().token,
    });

    const prepareUserAccounts = accountsbyOwner.value.map(r => TokenAccountParser(r.pubkey, r.account));

    const selectUserAccounts = prepareUserAccounts
        .filter(
            (a) => a && a.info.owner.toBase58() === wallet.publicKey?.toBase58()
        )
        .map((a) => a as TokenAccount);

    const userAccounts = selectUserAccounts.filter(
        (a) => a !== undefined
    ) as TokenAccount[];

    const obligations =
        programAccounts
            .filter(item =>
                isLendingObligation(item.account))
            .map((acc) =>
                LendingObligationParser(acc.pubkey, acc.account))


    const accountsByMint = userAccounts.reduce((res, acc) => {
        const id = acc.info.mint.toBase58();
        res.set(id, [...(res.get(id) || []), acc]);
        return res;
    }, new Map<string, TokenAccount[]>());

    const userObligations = obligations
        .filter(
            (acc) => accountsByMint.get(acc.info.tokenMint.toBase58()) !== undefined
        )
        .map((ob) => {
            return {
                obligation: ob,
                // @ts-ignore
                userAccounts: [...accountsByMint.get(ob.info.tokenMint.toBase58())],
            };
        });

    return !id ? userObligations : userObligations.filter(userObl => userObl.obligation.pubkey.toBase58() === id)


}

