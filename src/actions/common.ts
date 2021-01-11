import {LENDING_PROGRAM_ID} from "../constants";
import {calculateBorrowAPY, isLendingReserve, LendingReserve, LendingReserveParser} from "../models/lending";
import {Connection} from "@solana/web3.js";
import {ParsedAccount} from "../contexts/accounts";


export const getReserveAccounts = async (connection: Connection) => {
    const programAccounts = await connection.getProgramAccounts(
        LENDING_PROGRAM_ID
    );
    return programAccounts
        .filter(item =>
            isLendingReserve(item.account))
        .map((acc) =>
            LendingReserveParser(acc.pubkey, acc.account)).filter( acc => acc !== undefined
        ) as ParsedAccount<LendingReserve>[]
}

