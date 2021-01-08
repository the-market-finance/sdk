var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
import { PublicKey } from "@solana/web3.js";
import { AccountLayout, u64, MintLayout } from "@solana/spl-token";
import { chunks } from "../utils/utils";
import { EventEmitter } from "../utils/eventEmitter";
import { programIds, WRAPPED_SOL_MINT } from "../constants";
var pendingCalls = new Map();
var genericCache = new Map();
export var MintParser = function (pubKey, info) {
    var buffer = Buffer.from(info.data);
    var data = deserializeMint(buffer);
    var details = {
        pubkey: pubKey,
        account: __assign({}, info),
        info: data,
    };
    return details;
};
export var TokenAccountParser = function (pubKey, info) {
    var buffer = Buffer.from(info.data);
    var data = deserializeAccount(buffer);
    var details = {
        pubkey: pubKey,
        account: __assign({}, info),
        info: data,
    };
    return details;
};
export var GenericAccountParser = function (pubKey, info) {
    var buffer = Buffer.from(info.data);
    var details = {
        pubkey: pubKey,
        account: __assign({}, info),
        info: buffer,
    };
    return details;
};
export var keyToAccountParser = new Map();
export var cache = {
    emitter: new EventEmitter(),
    query: function (connection, pubKey, parser) { return __awaiter(void 0, void 0, void 0, function () {
        var id, address, account, query;
        return __generator(this, function (_a) {
            if (typeof pubKey === "string") {
                id = new PublicKey(pubKey);
            }
            else {
                id = pubKey;
            }
            address = id.toBase58();
            account = genericCache.get(address);
            if (account) {
                return [2 /*return*/, account];
            }
            query = pendingCalls.get(address);
            if (query) {
                return [2 /*return*/, query];
            }
            // TODO: refactor to use multiple accounts query with flush like behavior
            query = connection.getAccountInfo(id).then(function (data) {
                if (!data) {
                    throw new Error("Account not found");
                }
                return cache.add(id, data, parser);
            });
            pendingCalls.set(address, query);
            return [2 /*return*/, query];
        });
    }); },
    add: function (id, obj, parser) {
        var address = typeof id === "string" ? id : id === null || id === void 0 ? void 0 : id.toBase58();
        var deserialize = parser ? parser : keyToAccountParser.get(address);
        if (!deserialize) {
            throw new Error("Deserializer needs to be registered or passed as a parameter");
        }
        cache.registerParser(id, deserialize);
        pendingCalls.delete(address);
        var account = deserialize(new PublicKey(address), obj);
        if (!account) {
            return;
        }
        var isNew = !genericCache.has(address);
        genericCache.set(address, account);
        cache.emitter.raiseCacheUpdated(address, isNew, deserialize);
        return account;
    },
    get: function (pubKey) {
        var key;
        if (typeof pubKey !== "string") {
            key = pubKey.toBase58();
        }
        else {
            key = pubKey;
        }
        return genericCache.get(key);
    },
    byParser: function (parser) {
        var e_1, _a;
        var result = [];
        try {
            for (var _b = __values(keyToAccountParser.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var id = _c.value;
                if (keyToAccountParser.get(id) === parser) {
                    result.push(id);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return result;
    },
    registerParser: function (pubkey, parser) {
        if (pubkey) {
            var address = typeof pubkey === "string" ? pubkey : pubkey === null || pubkey === void 0 ? void 0 : pubkey.toBase58();
            keyToAccountParser.set(address, parser);
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
        account: account,
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
var PRECACHED_OWNERS = new Set();
export var precacheUserTokenAccounts = function (connection, owner) { return __awaiter(void 0, void 0, void 0, function () {
    var accounts;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!owner) {
                    return [2 /*return*/];
                }
                // used for filtering account updates over websocket
                PRECACHED_OWNERS.add(owner.toBase58());
                return [4 /*yield*/, connection.getTokenAccountsByOwner(owner, {
                        programId: programIds().token,
                    })];
            case 1:
                accounts = _a.sent();
                accounts.value.forEach(function (info) {
                    cache.add(info.pubkey.toBase58(), info.account, TokenAccountParser);
                });
                return [2 /*return*/];
        }
    });
}); };
export var getMultipleAccounts = function (connection, keys, commitment) { return __awaiter(void 0, void 0, void 0, function () {
    var result, array;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all(chunks(keys, 99).map(function (chunk) {
                    return getMultipleAccountsCore(connection, chunk, commitment);
                }))];
            case 1:
                result = _a.sent();
                array = result
                    .map(function (a) {
                    return a.array
                        .map(function (acc) {
                        if (!acc) {
                            return undefined;
                        }
                        var data = acc.data, rest = __rest(acc, ["data"]);
                        var obj = __assign(__assign({}, rest), { data: Buffer.from(data[0], "base64") });
                        return obj;
                    })
                        .filter(function (_) { return _; });
                })
                    .flat();
                return [2 /*return*/, { keys: keys, array: array }];
        }
    });
}); };
var getMultipleAccountsCore = function (connection, keys, commitment) { return __awaiter(void 0, void 0, void 0, function () {
    var args, unsafeRes, array;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                args = connection._buildArgs([keys], commitment, "base64");
                return [4 /*yield*/, connection._rpcRequest("getMultipleAccounts", args)];
            case 1:
                unsafeRes = _a.sent();
                if (unsafeRes.error) {
                    throw new Error("failed to get info about account " + unsafeRes.error.message);
                }
                if (unsafeRes.result.value) {
                    array = unsafeRes.result.value;
                    return [2 /*return*/, { keys: keys, array: array }];
                }
                // TODO: fix
                throw new Error();
        }
    });
}); };
// TODO: expose in spl package
var deserializeAccount = function (data) {
    var accountInfo = AccountLayout.decode(data);
    accountInfo.mint = new PublicKey(accountInfo.mint);
    accountInfo.owner = new PublicKey(accountInfo.owner);
    accountInfo.amount = u64.fromBuffer(accountInfo.amount);
    if (accountInfo.delegateOption === 0) {
        accountInfo.delegate = null;
        accountInfo.delegatedAmount = new u64(0);
    }
    else {
        accountInfo.delegate = new PublicKey(accountInfo.delegate);
        accountInfo.delegatedAmount = u64.fromBuffer(accountInfo.delegatedAmount);
    }
    accountInfo.isInitialized = accountInfo.state !== 0;
    accountInfo.isFrozen = accountInfo.state === 2;
    if (accountInfo.isNativeOption === 1) {
        accountInfo.rentExemptReserve = u64.fromBuffer(accountInfo.isNative);
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
        accountInfo.closeAuthority = new PublicKey(accountInfo.closeAuthority);
    }
    return accountInfo;
};
// TODO: expose in spl package
var deserializeMint = function (data) {
    if (data.length !== MintLayout.span) {
        throw new Error("Not a valid Mint");
    }
    var mintInfo = MintLayout.decode(data);
    if (mintInfo.mintAuthorityOption === 0) {
        mintInfo.mintAuthority = null;
    }
    else {
        mintInfo.mintAuthority = new PublicKey(mintInfo.mintAuthority);
    }
    mintInfo.supply = u64.fromBuffer(mintInfo.supply);
    mintInfo.isInitialized = mintInfo.isInitialized !== 0;
    if (mintInfo.freezeAuthorityOption === 0) {
        mintInfo.freezeAuthority = null;
    }
    else {
        mintInfo.freezeAuthority = new PublicKey(mintInfo.freezeAuthority);
    }
    return mintInfo;
};