"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DexMarketParser = exports.OrderBookParser = void 0;
const serum_1 = require("@project-serum/serum");
const web3_js_1 = require("@solana/web3.js");
const accountsC_1 = require("../../contexts/accountsC");
const OrderBookParser = (id, acc) => {
    const decoded = serum_1.Orderbook.LAYOUT.decode(acc.data);
    const details = {
        pubkey: id,
        account: {
            ...acc,
        },
        info: decoded,
    };
    return details;
};
exports.OrderBookParser = OrderBookParser;
const DEFAULT_DEX_ID = new web3_js_1.PublicKey('EUqojwWA2rd19FZrzeBncJsm38Jm1hEhE3zsmX3bRc2o');
const DexMarketParser = (pubkey, acc) => {
    const market = serum_1.MARKETS.find((m) => m.address.equals(pubkey));
    const decoded = serum_1.Market.getLayout(market?.programId || DEFAULT_DEX_ID).decode(acc.data);
    const details = {
        pubkey,
        account: {
            ...acc,
        },
        info: decoded,
    };
    accountsC_1.cache.registerParser(details.info.baseMint, accountsC_1.MintParser);
    accountsC_1.cache.registerParser(details.info.quoteMint, accountsC_1.MintParser);
    accountsC_1.cache.registerParser(details.info.bids, exports.OrderBookParser);
    accountsC_1.cache.registerParser(details.info.asks, exports.OrderBookParser);
    return details;
};
exports.DexMarketParser = DexMarketParser;
