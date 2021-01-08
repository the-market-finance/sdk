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
import { Market, MARKETS, Orderbook } from "@project-serum/serum";
import { PublicKey } from "@solana/web3.js";
import { MintParser, cache, } from "../../contexts/accounts";
export var OrderBookParser = function (id, acc) {
    var decoded = Orderbook.LAYOUT.decode(acc.data);
    var details = {
        pubkey: id,
        account: __assign({}, acc),
        info: decoded,
    };
    return details;
};
var DEFAULT_DEX_ID = new PublicKey("EUqojwWA2rd19FZrzeBncJsm38Jm1hEhE3zsmX3bRc2o");
export var DexMarketParser = function (pubkey, acc) {
    var market = MARKETS.find(function (m) { return m.address.equals(pubkey); });
    var decoded = Market.getLayout((market === null || market === void 0 ? void 0 : market.programId) || DEFAULT_DEX_ID).decode(acc.data);
    var details = {
        pubkey: pubkey,
        account: __assign({}, acc),
        info: decoded,
    };
    cache.registerParser(details.info.baseMint, MintParser);
    cache.registerParser(details.info.quoteMint, MintParser);
    cache.registerParser(details.info.bids, OrderBookParser);
    cache.registerParser(details.info.asks, OrderBookParser);
    return details;
};
