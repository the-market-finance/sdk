
import {AccountInfo, Connection, PublicKey} from "@solana/web3.js";
import {programIds, SWAP_HOST_FEE_ADDRESS, WRAPPED_SOL_MINT} from "../constants";
import {AccountLayout, u64, MintInfo, MintLayout} from "@solana/spl-token";
import {TokenAccount, PoolInfo} from "../models";
import {chunks} from "./utils";
import {EventEmitter} from "./eventEmitter";


const accountEmitter = new EventEmitter();

const pendingMintCalls = new Map<string, Promise<MintInfo>>();
const mintCache = new Map<string, MintInfo>();
const pendingAccountCalls = new Map<string, Promise<TokenAccount>>();
const accountsCache = new Map<string, TokenAccount>();

const pendingCalls = new Map<string, Promise<ParsedAccountBase>>();
const genericCache = new Map<string, ParsedAccountBase>();

const getAccountInfo = async (connection: Connection, pubKey: PublicKey) => {
    const info = await connection.getAccountInfo(pubKey);
    if (info === null) {
        throw new Error("Failed to find account");
    }

    return tokenAccountFactory(pubKey, info);
};

const getMintInfo = async (connection: Connection, pubKey: PublicKey) => {
    const info = await connection.getAccountInfo(pubKey);
    if (info === null) {
        throw new Error("Failed to find mint account");
    }

    const data = Buffer.from(info.data);

    return deserializeMint(data);
};

export interface ParsedAccountBase {
    pubkey: PublicKey;
    account: AccountInfo<Buffer>;
    info: any; // TODO: change to unkown
}

export interface ParsedAccount<T> extends ParsedAccountBase {
    info: T;
}

export type AccountParser = (
    pubkey: PublicKey,
    data: AccountInfo<Buffer>
) => ParsedAccountBase;
export const MintParser = (pubKey: PublicKey, info: AccountInfo<Buffer>) => {
    const buffer = Buffer.from(info.data);

    const data = deserializeMint(buffer);

    const details = {
        pubkey: pubKey,
        account: {
            ...info,
        },
        info: data,
    } as ParsedAccountBase;

    return details;
};

export const TokenAccountParser = tokenAccountFactory;

export const GenericAccountParser = (
    pubKey: PublicKey,
    info: AccountInfo<Buffer>
) => {
    const buffer = Buffer.from(info.data);

    const details = {
        pubkey: pubKey,
        account: {
            ...info,
        },
        info: buffer,
    } as ParsedAccountBase;

    return details;
};

export const keyToAccountParser = new Map<string, AccountParser>();

export const cache = {
    query: async (
        connection: Connection,
        pubKey: string | PublicKey,
        parser?: AccountParser
    ) => {
        let id: PublicKey;
        if (typeof pubKey === "string") {
            id = new PublicKey(pubKey);
        } else {
            id = pubKey;
        }

        const address = id.toBase58();

        let account = genericCache.get(address);
        if (account) {
            return account;
        }

        let query = pendingCalls.get(address);
        if (query) {
            return query;
        }

        query = connection.getAccountInfo(id).then((data) => {
            if (!data) {
                throw new Error("Account not found");
            }

            return cache.add(id, data, parser);
        }) as Promise<TokenAccount>;
        pendingCalls.set(address, query as any);

        return query;
    },
    add: (id: PublicKey, obj: AccountInfo<Buffer>, parser?: AccountParser) => {
        const address = id.toBase58();
        const deserialize = parser ? parser : keyToAccountParser.get(address);
        if (!deserialize) {
            throw new Error(
                "Deserializer needs to be registered or passed as a parameter"
            );
        }

        cache.registerParser(id, deserialize);
        pendingCalls.delete(address);
        const account = deserialize(id, obj);
        genericCache.set(address, account);
        return account;
    },
    get: (pubKey: string | PublicKey) => {
        let key: string;
        if (typeof pubKey !== "string") {
            key = pubKey.toBase58();
        } else {
            key = pubKey;
        }

        return genericCache.get(key);
    },
    registerParser: (pubkey: PublicKey, parser: AccountParser) => {
        keyToAccountParser.set(pubkey.toBase58(), parser);
    },

    queryAccount: async (connection: Connection, pubKey: string | PublicKey) => {
        let id: PublicKey;
        if (typeof pubKey === "string") {
            id = new PublicKey(pubKey);
        } else {
            id = pubKey;
        }

        const address = id.toBase58();

        let account = accountsCache.get(address);
        if (account) {
            return account;
        }

        let query = pendingAccountCalls.get(address);
        if (query) {
            return query;
        }

        query = getAccountInfo(connection, id).then((data) => {
            pendingAccountCalls.delete(address);
            accountsCache.set(address, data);
            return data;
        }) as Promise<TokenAccount>;
        pendingAccountCalls.set(address, query as any);

        return query;
    },
    addAccount: (pubKey: PublicKey, obj: AccountInfo<Buffer>) => {
        const account = tokenAccountFactory(pubKey, obj);
        accountsCache.set(account.pubkey.toBase58(), account);
        return account;
    },
    deleteAccount: (pubkey: PublicKey) => {
        const id = pubkey?.toBase58();
        accountsCache.delete(id);
        accountEmitter.raiseAccountUpdated(id);
    },
    getAccount: (pubKey: string | PublicKey) => {
        let key: string;
        if (typeof pubKey !== "string") {
            key = pubKey.toBase58();
        } else {
            key = pubKey;
        }

        return accountsCache.get(key);
    },
    queryMint: async (connection: Connection, pubKey: string | PublicKey) => {
        let id: PublicKey;
        if (typeof pubKey === "string") {
            id = new PublicKey(pubKey);
        } else {
            id = pubKey;
        }

        const address = id.toBase58();
        let mint = mintCache.get(address);
        if (mint) {
            return mint;
        }

        let query = pendingMintCalls.get(address);
        if (query) {
            return query;
        }

        query = getMintInfo(connection, id).then((data) => {
            pendingAccountCalls.delete(address);

            mintCache.set(address, data);
            return data;
        }) as Promise<MintInfo>;
        pendingAccountCalls.set(address, query as any);

        return query;
    },
    getMint: (pubKey: string | PublicKey) => {
        let key: string;
        if (typeof pubKey !== "string") {
            key = pubKey.toBase58();
        } else {
            key = pubKey;
        }

        return mintCache.get(key);
    },
    addMint: (pubKey: PublicKey, obj: AccountInfo<Buffer>) => {
        const mint = deserializeMint(obj.data);
        const id = pubKey.toBase58();
        mintCache.set(id, mint);
        return mint;
    },
};

export const getCachedAccount = (
    predicate: (account: TokenAccount) => boolean
) => {
    for (const account of accountsCache.values()) {
        if (predicate(account)) {
            return account as TokenAccount;
        }
    }
};

function tokenAccountFactory(pubKey: PublicKey, info: AccountInfo<Buffer>) {
    const buffer = Buffer.from(info.data);

    const data = deserializeAccount(buffer);

    const details = {
        pubkey: pubKey,
        account: {
            ...info,
        },
        info: data,
    } as TokenAccount;

    return details;
}

export function wrapNativeAccount(
    pubkey: PublicKey,
    account?: AccountInfo<Buffer>
): TokenAccount | undefined {
    if (!account) {
        return undefined;
    }

    return {
        pubkey: pubkey,
        account,
        info: {
            mint: WRAPPED_SOL_MINT,
            owner: pubkey,
            amount: new u64(account.lamports),
            delegate: null,
            delegatedAmount: new u64(0),
            isInitialized: true,
            isFrozen: false,
            isNative: true,
            rentExemptReserve: null,
            closeAuthority: null,
        },
    };
}



const PRECACHED_OWNERS = new Set<string>();
const precacheUserTokenAccounts = async (
    connection: Connection,
    owner?: PublicKey
) => {
    if (!owner) {
        return;
    }

    // used for filtering account updates over websocket
    PRECACHED_OWNERS.add(owner.toBase58());

    // user accounts are update via ws subscription
    const accounts = await connection.getTokenAccountsByOwner(owner, {
        programId: programIds().token,
    });
    accounts.value
        .map((info) => {
            const data = deserializeAccount(info.account.data);
            // need to query for mint to get decimals

            // TODO: move to web3.js for decoding on the client side... maybe with callback
            const details = {
                pubkey: info.pubkey,
                account: {
                    ...info.account,
                },
                info: data,
            } as TokenAccount;

            return details;
        })
        .forEach((acc) => {
            accountsCache.set(acc.pubkey.toBase58(), acc);
        });
};



export const getMultipleAccounts = async (
    connection: any,
    keys: string[],
    commitment: string
) => {
    const result = await Promise.all(
        chunks(keys, 99).map((chunk) =>
            getMultipleAccountsCore(connection, chunk, commitment)
        )
    );

    const array = result
        .map(
            (a) =>
                a.array
                    .filter((acc) => !!acc)
                    .map((acc) => {
                        const {data, ...rest} = acc;
                        const obj = {
                            ...rest,
                            data: Buffer.from(data[0], "base64"),
                        } as AccountInfo<Buffer>;
                        return obj;
                    }) as AccountInfo<Buffer>[]
        )
        .flat();
    return {keys, array};
};

const getMultipleAccountsCore = async (
    connection: any,
    keys: string[],
    commitment: string
) => {
    const args = connection._buildArgs([keys], commitment, "base64");

    const unsafeRes = await connection._rpcRequest("getMultipleAccounts", args);
    if (unsafeRes.error) {
        throw new Error(
            "failed to get info about account " + unsafeRes.error.message
        );
    }

    if (unsafeRes.result.value) {
        const array = unsafeRes.result.value as AccountInfo<string[]>[];
        return {keys, array};
    }

    // TODO: fix
    throw new Error();
};





// TODO: expose in spl package
const deserializeAccount = (data: Buffer) => {
    const accountInfo = AccountLayout.decode(data);
    accountInfo.mint = new PublicKey(accountInfo.mint);
    accountInfo.owner = new PublicKey(accountInfo.owner);
    accountInfo.amount = u64.fromBuffer(accountInfo.amount);

    if (accountInfo.delegateOption === 0) {
        accountInfo.delegate = null;
        accountInfo.delegatedAmount = new u64(0);
    } else {
        accountInfo.delegate = new PublicKey(accountInfo.delegate);
        accountInfo.delegatedAmount = u64.fromBuffer(accountInfo.delegatedAmount);
    }

    accountInfo.isInitialized = accountInfo.state !== 0;
    accountInfo.isFrozen = accountInfo.state === 2;

    if (accountInfo.isNativeOption === 1) {
        accountInfo.rentExemptReserve = u64.fromBuffer(accountInfo.isNative);
        accountInfo.isNative = true;
    } else {
        accountInfo.rentExemptReserve = null;
        accountInfo.isNative = false;
    }

    if (accountInfo.closeAuthorityOption === 0) {
        accountInfo.closeAuthority = null;
    } else {
        accountInfo.closeAuthority = new PublicKey(accountInfo.closeAuthority);
    }

    return accountInfo;
};

// TODO: expose in spl package
const deserializeMint = (data: Buffer) => {
    if (data.length !== MintLayout.span) {
        throw new Error("Not a valid Mint");
    }

    const mintInfo = MintLayout.decode(data);

    if (mintInfo.mintAuthorityOption === 0) {
        mintInfo.mintAuthority = null;
    } else {
        mintInfo.mintAuthority = new PublicKey(mintInfo.mintAuthority);
    }

    mintInfo.supply = u64.fromBuffer(mintInfo.supply);
    mintInfo.isInitialized = mintInfo.isInitialized !== 0;

    if (mintInfo.freezeAuthorityOption === 0) {
        mintInfo.freezeAuthority = null;
    } else {
        mintInfo.freezeAuthority = new PublicKey(mintInfo.freezeAuthority);
    }

    return mintInfo as MintInfo;
};
