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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
import { fromLamports, STABLE_COINS } from "../utils/utils";
import { cache, getMultipleAccounts } from "./accounts";
import { Market, Orderbook, TOKEN_MINTS } from "@project-serum/serum";
import { PublicKey } from "@solana/web3.js";
export var simulateMarketOrderFill = function (amount, reserve, dex) {
    var e_1, _a, _b;
    var _c, _d, _e;
    var liquidityMint = cache.get(reserve.liquidityMint);
    var collateralMint = cache.get(reserve.collateralMint);
    if (!liquidityMint || !collateralMint) {
        return 0.0;
    }
    var marketInfo = cache.get(dex);
    if (!marketInfo) {
        return 0.0;
    }
    var decodedMarket = marketInfo.info;
    var baseMintDecimals = ((_c = cache.get(decodedMarket.baseMint)) === null || _c === void 0 ? void 0 : _c.info.decimals) || 0;
    var quoteMintDecimals = ((_d = cache.get(decodedMarket.quoteMint)) === null || _d === void 0 ? void 0 : _d.info.decimals) || 0;
    var lendingMarket = cache.get(reserve.lendingMarket);
    var dexMarket = new Market(decodedMarket, baseMintDecimals, quoteMintDecimals, undefined, decodedMarket.programId);
    var bookAccount = lendingMarket.info.quoteMint.equals(reserve.liquidityMint)
        ? decodedMarket === null || decodedMarket === void 0 ? void 0 : decodedMarket.bids : decodedMarket === null || decodedMarket === void 0 ? void 0 : decodedMarket.asks;
    var bookInfo = (_e = cache.get(bookAccount)) === null || _e === void 0 ? void 0 : _e.info;
    if (!bookInfo) {
        return 0;
    }
    var book = new Orderbook(dexMarket, bookInfo.accountFlags, bookInfo.slab);
    var cost = 0;
    var remaining = fromLamports(amount, liquidityMint.info);
    if (book) {
        var depth = book.getL2(1000);
        var price = void 0, sizeAtLevel = void 0;
        var op = book.isBids
            ? function (price, size) { return size / price; }
            : function (price, size) { return size * price; };
        try {
            for (var depth_1 = __values(depth), depth_1_1 = depth_1.next(); !depth_1_1.done; depth_1_1 = depth_1.next()) {
                _b = __read(depth_1_1.value, 2), price = _b[0], sizeAtLevel = _b[1];
                var filled = remaining > sizeAtLevel ? sizeAtLevel : remaining;
                cost = cost + op(price, filled);
                remaining = remaining - filled;
                if (remaining <= 0) {
                    break;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (depth_1_1 && !depth_1_1.done && (_a = depth_1.return)) _a.call(depth_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    return cost;
};
var getMidPrice = function (marketAddress, mintAddress) {
    var _a, _b, _c, _d;
    var SERUM_TOKEN = TOKEN_MINTS.find(function (a) { return a.address.toBase58() === mintAddress; });
    if (STABLE_COINS.has((SERUM_TOKEN === null || SERUM_TOKEN === void 0 ? void 0 : SERUM_TOKEN.name) || "")) {
        return 1.0;
    }
    if (!marketAddress) {
        return 0.0;
    }
    var marketInfo = cache.get(marketAddress);
    if (!marketInfo) {
        return 0.0;
    }
    var decodedMarket = marketInfo.info;
    var baseMintDecimals = ((_a = cache.get(decodedMarket.baseMint)) === null || _a === void 0 ? void 0 : _a.info.decimals) || 0;
    var quoteMintDecimals = ((_b = cache.get(decodedMarket.quoteMint)) === null || _b === void 0 ? void 0 : _b.info.decimals) || 0;
    var market = new Market(decodedMarket, baseMintDecimals, quoteMintDecimals, undefined, decodedMarket.programId);
    var bids = (_c = cache.get(decodedMarket.bids)) === null || _c === void 0 ? void 0 : _c.info;
    var asks = (_d = cache.get(decodedMarket.asks)) === null || _d === void 0 ? void 0 : _d.info;
    if (bids && asks) {
        var bidsBook = new Orderbook(market, bids.accountFlags, bids.slab);
        var asksBook = new Orderbook(market, asks.accountFlags, asks.slab);
        var bestBid = bidsBook.getL2(1);
        var bestAsk = asksBook.getL2(1);
        if (bestBid.length > 0 && bestAsk.length > 0) {
            return (bestBid[0][0] + bestAsk[0][0]) / 2.0;
        }
    }
    return 0;
};
var refreshAccounts = function (connection, keys) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        if (keys.length === 0) {
            return [2 /*return*/, []];
        }
        return [2 /*return*/, getMultipleAccounts(connection, keys, "single").then(function (_a) {
                var keys = _a.keys, array = _a.array;
                return array.map(function (item, index) {
                    var address = keys[index];
                    return cache.add(new PublicKey(address), item);
                });
            })];
    });
}); };
