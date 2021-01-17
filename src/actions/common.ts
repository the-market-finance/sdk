import {LENDING_PROGRAM_ID} from "../constants";
import {calculateBorrowAPY, isLendingReserve, LendingReserve, LendingReserveParser} from "../models/lending";
import {Connection, PublicKey} from "@solana/web3.js";
import {ParsedAccount} from "../contexts/accounts";


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

