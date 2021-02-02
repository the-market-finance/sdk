import {LENDING_PROGRAM_ID, programIds} from "../constants";
import {
    calculateBorrowAPY,
    isLendingObligation,
    isLendingReserve, LendingObligationParser,
    LendingReserve,
    LendingReserveParser
} from "../models/lending";
import {Connection, PublicKey} from "@solana/web3.js";
import {cache, getMultipleAccounts, ParsedAccount, TokenAccountParser} from "../contexts/accounts";
import {TokenAccount} from "../models";
import {wrapNativeAccount} from "../utils/accounts";
import {DexMarketParser} from "../models/dex";
import {refreshAccounts} from "../contexts/market";
import {SerumMarket} from "./enriched";

export const getUserAccounts = async (connection: Connection, wallet: any) => {
    const accountsbyOwner = await connection.getTokenAccountsByOwner(wallet?.publicKey, {
        programId: programIds().token,
    });

    const ownerInfo = await connection.getAccountInfo(wallet.publicKey);

    if (!ownerInfo){throw Error('ownerInfo not found.')}

    const prepareUserAccounts = accountsbyOwner.value.map(r => TokenAccountParser(r.pubkey, r.account));

    const selectUserAccounts = [...prepareUserAccounts, wrapNativeAccount(wallet.publicKey,ownerInfo)]
        .filter(
            (a) => a && a.info.owner.toBase58() === wallet.publicKey?.toBase58()
        )
        .map((a) => a as TokenAccount);

    return selectUserAccounts.filter(
        (a) => a !== undefined
    ) as TokenAccount[];
}


/**
 * Get parsed tokens for operations (deposit, borrow)
 *
 * @param connection: Connection
 * (optional, passed to get one account at this address, an array of 1 elements)
 * @param address?: string | PublicKey
 * @return Promise<ParsedAccount<LendingReserve>[]>
 * @async
 */
export const getReserveAccounts = async (connection: Connection, address?: string | PublicKey): Promise<ParsedAccount<LendingReserve>[]> => {
    const id = typeof address === "string" ? address : address?.toBase58();
    const programAccounts = await connection.getProgramAccounts(
        LENDING_PROGRAM_ID
    );
    const lendingReserveAccounts = programAccounts
        .filter(item =>
            isLendingReserve(item.account))
        .map((acc) =>
            LendingReserveParser(acc.pubkey, acc.account)).filter(acc => acc !== undefined
        ) as ParsedAccount<LendingReserve>[]

    return !id ? lendingReserveAccounts : lendingReserveAccounts.filter(acc => acc?.pubkey.toBase58() === id)
}
/**
 * Get parsed tokens for operations (deposit, withdraw)
 *
 * @param connection: Connection
 * @param wallet: Wallet
 * (optional, passed to get one account at this address, an array of 1 elements)
 * @param address?: string | PublicKey
 * @return Promise<ParsedAccount<TokenAccount>[]>
 * @async
 */
export const getUserDeposit = async (connection: Connection, wallet: any, address?: string | PublicKey) => {

    const id = typeof address === "string" ? address : address?.toBase58();

    const reserveAccounts = await getReserveAccounts(connection);

    const reservesByCollateralMint = reserveAccounts.reduce((result, item) => {
        result.set(item.info.collateralMint.toBase58(), item);
        return result;
    }, new Map<string, ParsedAccount<LendingReserve>>());


    const userAccounts = await getUserAccounts(connection, wallet);

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
 * Get obligations with a user account, for operations (borrow repayment)
 *
 * @param connection: Connection
 * @param wallet: Wallet
 * (optional, passed to get one account at this address, an array of 1 elements)
 * @param address?: string | PublicKey
 * @return Promise<{obligation:any, userAccounts:any}[]>
 * @async
 */
export const getUserObligations = async (connection: Connection, wallet: any, address?: string | PublicKey) => {
    const id = typeof address === "string" ? address : address?.toBase58();
    const programAccounts = await connection.getProgramAccounts(
        LENDING_PROGRAM_ID
    );

    const userAccounts = await getUserAccounts(connection, wallet)

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


export const initalQuery = async (connection:Connection,marketByMint:Map<string, SerumMarket>) => {
    const reverseSerumMarketCache = new Map<string, string>();
    [...marketByMint.keys()].forEach((mint) => {
        const m = marketByMint.get(mint);
        if (m) {
            reverseSerumMarketCache.set(m.marketInfo.address.toBase58(), mint);
        }
    });

    const allMarkets = [...marketByMint.values()].map((m) => {
        return m.marketInfo.address.toBase58();
    });

    await getMultipleAccounts(
        connection,
        // only query for markets that are not in cahce
        allMarkets,
        "single"
    ).then(({keys, array}) => {
        allMarkets.forEach(() => {
        });

        return array.map((item, index) => {
            const marketAddress = keys[index];
            cache.add(new PublicKey(marketAddress), item);
            const mintAddress = reverseSerumMarketCache.get(marketAddress);
            if (mintAddress) {
                const market = marketByMint.get(mintAddress);

                if (market) {
                    const id = market.marketInfo.address;
                    cache.add(id, item, DexMarketParser);
                }
            }

            return item;
        });
    })
    const toQuery = new Set<string>();
    allMarkets.forEach((m) => {
        const market = cache.get(m);
        if (!market) {
            return;
        }

        const decoded = market;

        if (!cache.get(decoded.info.baseMint)) {
            toQuery.add(decoded.info.baseMint.toBase58());
        }

        if (!cache.get(decoded.info.baseMint)) {
            toQuery.add(decoded.info.quoteMint.toBase58());
        }

        toQuery.add(decoded.info.bids.toBase58());
        toQuery.add(decoded.info.asks.toBase58());
    });

    await refreshAccounts(connection, [...toQuery.keys()]);
}

