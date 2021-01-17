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


export const getReserveAccounts = async (connection: Connection, address?: string | PublicKey) => {
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

