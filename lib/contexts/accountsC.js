"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMultipleAccounts = exports.cache = exports.keyToAccountParser = exports.GenericAccountParser = exports.TokenAccountParser = exports.MintParser = void 0;
const web3_js_1 = require("@solana/web3.js");
const ids_1 = require("../constants/ids");
const spl_token_1 = require("@solana/spl-token");
const utils_1 = require("./../utils/utils");
const eventEmitter_1 = require("./../utils/eventEmitter");
const pendingCalls = new Map();
const genericCache = new Map();
const MintParser = (pubKey, info) => {
    const buffer = Buffer.from(info.data);
    const data = deserializeMint(buffer);
    const details = {
        pubkey: pubKey,
        account: {
            ...info,
        },
        info: data,
    };
    return details;
};
exports.MintParser = MintParser;
const TokenAccountParser = (pubKey, info) => {
    const buffer = Buffer.from(info.data);
    const data = deserializeAccount(buffer);
    const details = {
        pubkey: pubKey,
        account: {
            ...info,
        },
        info: data,
    };
    return details;
};
exports.TokenAccountParser = TokenAccountParser;
const GenericAccountParser = (pubKey, info) => {
    const buffer = Buffer.from(info.data);
    const details = {
        pubkey: pubKey,
        account: {
            ...info,
        },
        info: buffer,
    };
    return details;
};
exports.GenericAccountParser = GenericAccountParser;
exports.keyToAccountParser = new Map();
exports.cache = {
    emitter: new eventEmitter_1.EventEmitter(),
    query: async (connection, pubKey, parser) => {
        let id;
        if (typeof pubKey === 'string') {
            id = new web3_js_1.PublicKey(pubKey);
        }
        else {
            id = pubKey;
        }
        const address = id.toBase58();
        const account = genericCache.get(address);
        if (account) {
            return account;
        }
        let query = pendingCalls.get(address);
        if (query) {
            return query;
        }
        // TODO: refactor to use multiple accounts query with flush like behavior
        query = connection.getAccountInfo(id).then((data) => {
            if (!data) {
                throw new Error('Account not found');
            }
            return exports.cache.add(id, data, parser);
        });
        pendingCalls.set(address, query);
        return query;
    },
    add: (id, obj, parser) => {
        const address = typeof id === 'string' ? id : id?.toBase58();
        const deserialize = parser ? parser : exports.keyToAccountParser.get(address);
        if (!deserialize) {
            throw new Error('Deserializer needs to be registered or passed as a parameter');
        }
        exports.cache.registerParser(id, deserialize);
        pendingCalls.delete(address);
        const account = deserialize(new web3_js_1.PublicKey(address), obj);
        if (!account) {
            return;
        }
        const isNew = !genericCache.has(address);
        genericCache.set(address, account);
        exports.cache.emitter.raiseCacheUpdated(address, isNew, deserialize);
        return account;
    },
    get: (pubKey) => {
        let key;
        if (typeof pubKey !== 'string') {
            key = pubKey.toBase58();
        }
        else {
            key = pubKey;
        }
        return genericCache.get(key);
    },
    byParser: (parser) => {
        const result = [];
        for (const id of exports.keyToAccountParser.keys()) {
            if (exports.keyToAccountParser.get(id) === parser) {
                result.push(id);
            }
        }
        return result;
    },
    registerParser: (pubkey, parser) => {
        if (pubkey) {
            const address = typeof pubkey === 'string' ? pubkey : pubkey?.toBase58();
            exports.keyToAccountParser.set(address, parser);
        }
        return pubkey;
    },
};
function wrapNativeAccount(pubkey, account) {
    if (!account) {
        return undefined;
    }
    return {
        pubkey: pubkey,
        account,
        info: {
            mint: ids_1.WRAPPED_SOL_MINT,
            owner: pubkey,
            amount: new spl_token_1.u64(account.lamports),
            delegate: null,
            delegatedAmount: new spl_token_1.u64(0),
            isInitialized: true,
            isFrozen: false,
            isNative: true,
            rentExemptReserve: null,
            closeAuthority: null,
        },
    };
}
const PRECACHED_OWNERS = new Set();
const precacheUserTokenAccounts = async (connection, owner) => {
    if (!owner) {
        return;
    }
    // used for filtering account updates over websocket
    PRECACHED_OWNERS.add(owner.toBase58());
    // user accounts are update via ws subscription
    const accounts = await connection.getTokenAccountsByOwner(owner, {
        programId: ids_1.programIds().token,
    });
    accounts.value.forEach((info) => {
        exports.cache.add(info.pubkey.toBase58(), info.account, exports.TokenAccountParser);
    });
};
const getMultipleAccounts = async (connection, keys, commitment) => {
    const result = await Promise.all(utils_1.chunks(keys, 99).map((chunk) => getMultipleAccountsCore(connection, chunk, commitment)));
    const array = result
        .map((a) => a.array
        .map((acc) => {
        if (!acc) {
            return undefined;
        }
        const { data, ...rest } = acc;
        const obj = {
            ...rest,
            data: Buffer.from(data[0], 'base64'),
        };
        return obj;
    })
        .filter((_) => _))
        .flat();
    return { keys, array };
};
exports.getMultipleAccounts = getMultipleAccounts;
const getMultipleAccountsCore = async (connection, keys, commitment) => {
    const args = connection._buildArgs([keys], commitment, 'base64');
    const unsafeRes = await connection._rpcRequest('getMultipleAccounts', args);
    if (unsafeRes.error) {
        throw new Error('failed to get info about account ' + unsafeRes.error.message);
    }
    if (unsafeRes.result.value) {
        const array = unsafeRes.result.value;
        return { keys, array };
    }
    // TODO: fix
    throw new Error();
};
// TODO: expose in spl package
const deserializeAccount = (data) => {
    const accountInfo = spl_token_1.AccountLayout.decode(data);
    accountInfo.mint = new web3_js_1.PublicKey(accountInfo.mint);
    accountInfo.owner = new web3_js_1.PublicKey(accountInfo.owner);
    accountInfo.amount = spl_token_1.u64.fromBuffer(accountInfo.amount);
    if (accountInfo.delegateOption === 0) {
        accountInfo.delegate = null;
        accountInfo.delegatedAmount = new spl_token_1.u64(0);
    }
    else {
        accountInfo.delegate = new web3_js_1.PublicKey(accountInfo.delegate);
        accountInfo.delegatedAmount = spl_token_1.u64.fromBuffer(accountInfo.delegatedAmount);
    }
    accountInfo.isInitialized = accountInfo.state !== 0;
    accountInfo.isFrozen = accountInfo.state === 2;
    if (accountInfo.isNativeOption === 1) {
        accountInfo.rentExemptReserve = spl_token_1.u64.fromBuffer(accountInfo.isNative);
        accountInfo.isNative = true;
    }
    else {
        accountInfo.rentExemptReserve = null;
        accountInfo.isNative = false;
    }
    if (accountInfo.closeAuthorityOption === 0) {
        accountInfo.closeAuthority = null;
    }
    else {
        accountInfo.closeAuthority = new web3_js_1.PublicKey(accountInfo.closeAuthority);
    }
    return accountInfo;
};
// TODO: expose in spl package
const deserializeMint = (data) => {
    if (data.length !== spl_token_1.MintLayout.span) {
        throw new Error('Not a valid Mint');
    }
    const mintInfo = spl_token_1.MintLayout.decode(data);
    if (mintInfo.mintAuthorityOption === 0) {
        mintInfo.mintAuthority = null;
    }
    else {
        mintInfo.mintAuthority = new web3_js_1.PublicKey(mintInfo.mintAuthority);
    }
    mintInfo.supply = spl_token_1.u64.fromBuffer(mintInfo.supply);
    mintInfo.isInitialized = mintInfo.isInitialized !== 0;
    if (mintInfo.freezeAuthorityOption === 0) {
        mintInfo.freezeAuthority = null;
    }
    else {
        mintInfo.freezeAuthority = new web3_js_1.PublicKey(mintInfo.freezeAuthority);
    }
    return mintInfo;
};
