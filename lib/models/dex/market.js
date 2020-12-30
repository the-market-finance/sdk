"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DexMarketParser = exports.OrderBookParser = void 0;
var serum_1 = require("@project-serum/serum");
var web3_js_1 = require("@solana/web3.js");
var accountsC_1 = require("../../contexts/accountsC");
var OrderBookParser = function (id, acc) {
    var decoded = serum_1.Orderbook.LAYOUT.decode(acc.data);
    var details = {
        pubkey: id,
        account: __assign({}, acc),
        info: decoded,
    };
    return details;
};
exports.OrderBookParser = OrderBookParser;
var DEFAULT_DEX_ID = new web3_js_1.PublicKey('EUqojwWA2rd19FZrzeBncJsm38Jm1hEhE3zsmX3bRc2o');
var DexMarketParser = function (pubkey, acc) {
    var market = serum_1.MARKETS.find(function (m) { return m.address.equals(pubkey); });
    var decoded = serum_1.Market.getLayout((market === null || market === void 0 ? void 0 : market.programId) || DEFAULT_DEX_ID).decode(acc.data);
    var details = {
        pubkey: pubkey,
        account: __assign({}, acc),
        info: decoded,
    };
    accountsC_1.cache.registerParser(details.info.baseMint, accountsC_1.MintParser);
    accountsC_1.cache.registerParser(details.info.quoteMint, accountsC_1.MintParser);
    accountsC_1.cache.registerParser(details.info.bids, exports.OrderBookParser);
    accountsC_1.cache.registerParser(details.info.asks, exports.OrderBookParser);
    return details;
};
exports.DexMarketParser = DexMarketParser;
