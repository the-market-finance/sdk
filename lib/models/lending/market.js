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
import * as BufferLayout from 'buffer-layout';
import * as Layout from './../../utils/layout';
export var LendingMarketLayout = BufferLayout.struct([
    BufferLayout.u8('isInitialized'),
    Layout.publicKey('quoteMint'),
]);
export var isLendingMarket = function (info) {
    return info.data.length === LendingMarketLayout.span;
};
export var LendingMarketParser = function (pubKey, info) {
    var buffer = Buffer.from(info.data);
    var data = LendingMarketLayout.decode(buffer);
    var details = {
        pubkey: pubKey,
        account: __assign({}, info),
        info: data,
    };
    return details;
};
// TODO:
// create instructions for init
