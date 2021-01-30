import {AccountInfo, Connection, PublicKey} from "@solana/web3.js";
import {MintInfo} from "@solana/spl-token";
import {Market, MARKETS, Orderbook, TOKEN_MINTS} from "@project-serum/serum";
import {
    cache,
    getMultipleAccounts, MintParser,
    ParsedAccount,
    precacheUserTokenAccounts,
} from "../contexts/accounts";
import {LENDING_PROGRAM_ID} from "../constants";
import {
    isLendingObligation,
    isLendingReserve,
    LendingReserveParser,
    LendingObligationParser,
    LendingReserve, collateralToLiquidity, LendingObligation, isLendingMarket, LendingMarketParser
} from "../models/lending";
import {MINT_TO_MARKET} from "../models/marketOverrides";
import {fromLamports, getTokenName, KnownToken, KnownTokenMap, STABLE_COINS, wadToLamports} from "../utils/utils";
import {DexMarketParser} from "../models/dex";
import {localTokens} from "../config/tokens";
import {refreshAccounts, simulateMarketOrderFill} from "../contexts/market";
import {getUserObligations} from "./common";

interface EnrichedLendingObligationInfo extends LendingObligation {
    ltv: number;
    health: number;
    borrowedInQuote: number;
    collateralInQuote: number;
    liquidationThreshold: number;
    repayName: string;
    collateralName: string;
}

export interface EnrichedLendingObligation {
    account: ParsedAccount<LendingObligation>;
    info: EnrichedLendingObligationInfo;
}
const processAccount = (item:any) => {
    if (isLendingReserve(item.account)) {
        const reserve = cache.add(
            item.pubkey.toBase58(),
            item.account,
            LendingReserveParser
        );

        return reserve;
    } else if (isLendingMarket(item.account)) {
        return cache.add(
            item.pubkey.toBase58(),
            item.account,
            LendingMarketParser
        );
    } else if (isLendingObligation(item.account)) {
        return cache.add(
            item.pubkey.toBase58(),
            item.account,
            LendingObligationParser
        );
    }
}

const queryLendingAccounts = async (connection:Connection, programAccounts:any[]) => {

    const accounts = programAccounts
        .map(processAccount)
        .filter((item) => item !== undefined);

    const lendingReserves = accounts
        .filter(
            (acc) => (acc?.info as LendingReserve).lendingMarket !== undefined
        )
        .map((acc) => acc as ParsedAccount<LendingReserve>);

    const toQuery = [
        ...lendingReserves.map((acc) => {
            const result = [
                cache.registerParser(
                    acc?.info.collateralMint.toBase58(),
                    MintParser
                ),
                cache.registerParser(
                    acc?.info.liquidityMint.toBase58(),
                    MintParser
                ),
                // ignore dex if its not set
                cache.registerParser(
                    acc?.info.dexMarketOption ? acc?.info.dexMarket.toBase58() : "",
                    DexMarketParser
                ),
            ].filter((_) => _);
            return result;
        }),
    ].flat() as string[];

    // This will pre-cache all accounts used by pools
    // All those accounts are updated whenever there is a change
    await getMultipleAccounts(connection, toQuery, "single").then(
        ({ keys, array }) => {
            return array.map((obj, index) => {
                const address = keys[index];
                cache.add(address, obj, );
                return obj;
            }) as any[];
        }
    );

    // HACK: fix, force account refresh
    programAccounts.map(processAccount).filter((item) => item !== undefined);

    return accounts;
};



interface SerumMarket {
    marketInfo: {
        address: PublicKey;
        name: string;
        programId: PublicKey;
        deprecated: boolean;
    };

    // 1st query
    marketAccount?: AccountInfo<Buffer>;

    // 2nd query
    mintBase?: AccountInfo<Buffer>;
    mintQuote?: AccountInfo<Buffer>;
    bidAccount?: AccountInfo<Buffer>;
    askAccount?: AccountInfo<Buffer>;
    eventQueue?: AccountInfo<Buffer>;

    swap?: {
        dailyVolume: number;
    };

    midPrice?: (mint?: PublicKey) => number;
}

export const getEnrichedLendingObligations = async (connection: Connection, wallet: any, address?: string | PublicKey) => {

    const id = address ? typeof address === "string" ? address : address?.toBase58() : undefined;

    const programAccounts = await connection.getProgramAccounts(
        LENDING_PROGRAM_ID
    );

    // cache
    await precacheUserTokenAccounts(connection, wallet.publicKey)

    const reserveAccounts = programAccounts.filter(item =>
        isLendingReserve(item.account))
        .map((acc) =>
            LendingReserveParser(acc.pubkey, acc.account)).filter(acc => acc?.pubkey.toBase58()) as ParsedAccount<LendingReserve>[]

    const obligations = programAccounts.filter(item =>
        isLendingObligation(item.account))
        .map((acc) =>
            LendingObligationParser(acc.pubkey, acc.account)).filter(acc => acc?.pubkey.toBase58());

    // precache obligation mints
    const userObligationsByReserve = await getUserObligations(connection, wallet)

    const { keys, array } = await getMultipleAccounts(
        connection,
        userObligationsByReserve.map((item) =>
            item.obligation.info.tokenMint.toBase58()
        ),
        "single"
    );

    array.forEach((item, index) => {
        const address = keys[index];
        cache.add(new PublicKey(address), item, MintParser);
    });

    const availableReserves = reserveAccounts.reduce((map, reserve) => {
        map.set(reserve.pubkey.toBase58(), reserve);
        return map;
    }, new Map<string, ParsedAccount<LendingReserve>>());


    const marketMints = reserveAccounts.map((reserve) => reserve.info.liquidityMint.toBase58())

    const marketByMint = marketMints.reduce((acc, key) => {
        const mintAddress = key;

        const SERUM_TOKEN = TOKEN_MINTS.find(
            (a) => a.address.toBase58() === mintAddress
        );
        const marketAddress = MINT_TO_MARKET[mintAddress];
        const marketName = `${SERUM_TOKEN?.name}/USDC`;
        const marketInfo = MARKETS.find(
            (m) => m.name === marketName || m.address.toBase58() === marketAddress
        );
        if (marketInfo) {
            acc.set(mintAddress, {
                marketInfo,
            });
        }
        return acc;
    }, new Map<string, SerumMarket>()) as Map<string, SerumMarket>;


    const midPriceInUSD = (mintAddress: string) => {
        return getMidPrice(
            marketByMint.get(mintAddress)?.marketInfo.address.toBase58(),
            mintAddress
        );
    }

    const getMidPrice = (marketAddress?: string, mintAddress?: string) => {
        const SERUM_TOKEN = TOKEN_MINTS.find(
            (a) => a.address.toBase58() === mintAddress
        );

        if (STABLE_COINS.has(SERUM_TOKEN?.name || "")) {
            return 1.0;
        }

        if (!marketAddress) {
            return 0.0;
        }

        const marketInfo = cache.get(marketAddress);
        if (!marketInfo) {
            return 0.0;
        }

        const decodedMarket = marketInfo.info;

        const baseMintDecimals =
            cache.get(decodedMarket.baseMint)?.info.decimals || 0;
        const quoteMintDecimals =
            cache.get(decodedMarket.quoteMint)?.info.decimals || 0;

        const market = new Market(
            decodedMarket,
            baseMintDecimals,
            quoteMintDecimals,
            undefined,
            decodedMarket.programId
        );

        const bids = cache.get(decodedMarket.bids)?.info;
        const asks = cache.get(decodedMarket.asks)?.info;

        if (bids && asks) {
            const bidsBook = new Orderbook(market, bids.accountFlags, bids.slab);
            const asksBook = new Orderbook(market, asks.accountFlags, asks.slab);

            const bestBid = bidsBook.getL2(1);
            const bestAsk = asksBook.getL2(1);

            if (bestBid.length > 0 && bestAsk.length > 0) {
                return (bestBid[0][0] + bestAsk[0][0]) / 2.0;
            }
        }

        return 0;
    };

    await queryLendingAccounts(connection, programAccounts)

    const initalQuery = async () => {
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

    await initalQuery();

    const tokenMapFetch = async () => {
        return await new Promise((resolve, reject) => {
            fetch(
                `https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/mainnet-beta.json`
            )
                .then((res) => {
                    return res.json();
                })
                .catch((err) => reject(err))
                .then((list: KnownToken[]) => {
                    resolve([...localTokens, ...list].reduce((map, item) => {
                        map.set(item.mintAddress, item);
                        return map;
                    }, new Map<string, KnownToken>()))
                })
        })
    }

    const tokenMap = await tokenMapFetch() as KnownTokenMap;

    const enriched = obligations
        .map((obligation) => ({
            obligation,
            reserve: availableReserves.get(
                obligation.info.borrowReserve.toBase58()
            ) as ParsedAccount<LendingReserve>,
            collateralReserve: availableReserves.get(
                obligation.info.collateralReserve.toBase58()
            ) as ParsedAccount<LendingReserve>,
        }))
        // use obligations with reserves available
        .filter((item) => item.reserve)
        // use reserves with borrow amount greater than zero
        .filter(
            (item) =>
                wadToLamports(item.obligation.info.borrowAmountWad).toNumber() > 0
        )
        .map((item) => {
            const obligation = item.obligation;
            const reserve = item.reserve.info;
            const collateralReserve = item.reserve.info;
            const liquidityMint = cache.get(
                reserve.liquidityMint
            ) as ParsedAccount<MintInfo>;
            let ltv = 0;
            let health = 0;
            let borrowedInQuote = 0;
            let collateralInQuote = 0;

            if (liquidityMint) {
                const collateralMint = cache.get(item.collateralReserve.info.liquidityMint);

                const collateral = fromLamports(
                    collateralToLiquidity(
                        obligation.info.depositedCollateral,
                        item.reserve.info
                    ),
                    collateralMint?.info,
                );

                const borrowed = wadToLamports(
                    obligation.info.borrowAmountWad
                ).toNumber();

                const borrowedAmount = simulateMarketOrderFill(
                    borrowed,
                    item.reserve.info,
                    item.reserve.info.dexMarketOption
                        ? item.reserve.info.dexMarket
                        : item.collateralReserve.info.dexMarket,
                );

                const liquidityMintAddress = item.reserve.info.liquidityMint.toBase58();
                const liquidityMint = cache.get(liquidityMintAddress) as ParsedAccount<MintInfo>;
                borrowedInQuote = fromLamports(borrowed, liquidityMint.info) * midPriceInUSD(liquidityMintAddress);

                collateralInQuote = collateral * midPriceInUSD(collateralMint?.pubkey.toBase58() || '');

                ltv = (100 * borrowedAmount) / collateral;

                const liquidationThreshold =
                    item.reserve.info.config.liquidationThreshold;

                health = collateral * liquidationThreshold / 100 / borrowedAmount;
            }

            return {
                account: obligation,
                info: {
                    ...obligation.info,
                    ltv,
                    health,
                    borrowedInQuote,
                    collateralInQuote,
                    liquidationThreshold: item.reserve.info.config.liquidationThreshold,
                    repayName: getTokenName(tokenMap, reserve.liquidityMint),
                    collateralName: getTokenName(tokenMap, collateralReserve.liquidityMint)
                },
            } as EnrichedLendingObligation;
        })
        .sort((a, b) => a.info.health - b.info.health)

    return id ? enriched.filter((ob) => ob.account.pubkey.toBase58() === id) : enriched

}
