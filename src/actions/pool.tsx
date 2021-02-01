import {Connection, PublicKey} from "@solana/web3.js";
import {PoolInfo} from "../models";
import {
    TokenSwapLayout,
    TokenSwapLayoutLegacyV0 as TokenSwapLayoutV0,
    TokenSwapLayoutV1
} from "../models/tokenSwap";

import {AccountLayout, MintLayout} from "@solana/spl-token";
import {cache, getMultipleAccounts} from "../utils/accounts";
import {programIds} from "../constants";


const toPoolInfo = (item: any, program: PublicKey) => {
    const mint = new PublicKey(item.data.tokenPool);
    return {
        pubkeys: {
            account: item.pubkey,
            program: program,
            mint,
            holdingMints: [] as PublicKey[],
            holdingAccounts: [item.data.tokenAccountA, item.data.tokenAccountB].map(
                (a) => new PublicKey(a)
            ),
        },
        legacy: false,
        raw: item,
    } as PoolInfo;
};

const getHoldings = (connection: Connection, accounts: string[]) => {
    return accounts.map((acc) =>
        cache.queryAccount(connection, new PublicKey(acc))
    );
};

const getPoolForBasket = async (connection:Connection, mints: (string | undefined)[], allPools:PoolInfo[]) => {
    const sortedMints = [...mints].sort(); // eslint-disable-line
    const pools = await (async () => {
        let matchingPool = allPools
            .filter((p) => !p.legacy)
            .filter((p) =>
                p.pubkeys.holdingMints
                    .map((a) => a.toBase58())
                    .sort()
                    .every((address, i) => address === sortedMints[i])
            );

        for (let i = 0; i < matchingPool.length; i++) {
            const p = matchingPool[i];

            const account = await cache.queryAccount(
                connection,
                p.pubkeys.holdingAccounts[0]
            );

            if (!account.info.amount.eqn(0)) {
                return p;
            }
        }
    })();
    return pools;
}


export const getPools = async (connection:Connection, mints: (string | undefined)[]) => {
    const queryPools = async (swapId: PublicKey, isLegacy = false) => {
        let poolsArray: PoolInfo[] = [];
        (await connection.getProgramAccounts(swapId))
            .filter(
                (item) =>
                    item.account.data.length === TokenSwapLayout.span ||
                    item.account.data.length === TokenSwapLayoutV1.span ||
                    item.account.data.length === TokenSwapLayoutV0.span
            )
            .map((item) => {
                let result = {
                    data: undefined as any,
                    account: item.account,
                    pubkey: item.pubkey,
                    init: async () => { },
                };

                const layout =
                    item.account.data.length === TokenSwapLayout.span
                        ? TokenSwapLayout
                        : item.account.data.length === TokenSwapLayoutV1.span
                        ? TokenSwapLayoutV1
                        : TokenSwapLayoutV0;

                // handling of legacy layout can be removed soon...
                if (layout === TokenSwapLayoutV0) {
                    result.data = layout.decode(item.account.data);
                    let pool = toPoolInfo(result, swapId);
                    pool.legacy = isLegacy;
                    poolsArray.push(pool as PoolInfo);

                    result.init = async () => {
                        try {
                            // TODO: this is not great
                            // Ideally SwapLayout stores hash of all the mints to make finding of pool for a pair easier
                            const holdings = await Promise.all(
                                getHoldings(connection, [
                                    result.data.tokenAccountA,
                                    result.data.tokenAccountB,
                                ])
                            );

                            pool.pubkeys.holdingMints = [
                                holdings[0].info.mint,
                                holdings[1].info.mint,
                            ] as PublicKey[];
                        } catch (err) {
                            console.log(err);
                        }
                    };
                } else {
                    result.data = layout.decode(item.account.data);

                    let pool = toPoolInfo(result, swapId);
                    pool.legacy = isLegacy;
                    pool.pubkeys.feeAccount = new PublicKey(result.data.feeAccount);
                    pool.pubkeys.holdingMints = [
                        new PublicKey(result.data.mintA),
                        new PublicKey(result.data.mintB),
                    ] as PublicKey[];

                    poolsArray.push(pool as PoolInfo);
                }

                return result;
            });

        const toQuery = poolsArray
            .map(
                (p) =>
                    [
                        ...p.pubkeys.holdingAccounts.map((h) => h.toBase58()),
                        ...p.pubkeys.holdingMints.map((h) => h.toBase58()),
                        p.pubkeys.feeAccount?.toBase58(), // used to calculate volume aproximation
                        p.pubkeys.mint.toBase58(),
                    ].filter((p) => p) as string[]
            )
            .flat();

        // This will pre-cache all accounts used by pools
        // All those accounts are updated whenever there is a change
        await getMultipleAccounts(connection, toQuery, "single").then(
            ({ keys, array }) => {
                return array.map((obj, index) => {
                    const pubKey = new PublicKey(keys[index]);
                    if (obj.data.length === AccountLayout.span) {
                        return cache.addAccount(pubKey, obj);
                    } else if (obj.data.length === MintLayout.span) {
                        if (!cache.getMint(pubKey)) {
                            return cache.addMint(pubKey, obj);
                        }
                    }

                    return obj;
                }) as any[];
            }
        );

        return poolsArray;
    };


    console.log('programIds()',programIds())

    const mixPool = await Promise.all([
            queryPools(programIds().swap),
            ...programIds().swap_legacy.map((leg) => queryPools(leg, true)),
        ])

    const AllPools = mixPool.flat();

    return await getPoolForBasket(connection, mints, AllPools)
}