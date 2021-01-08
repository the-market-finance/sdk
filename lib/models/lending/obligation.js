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
import * as BufferLayout from "buffer-layout";
import * as Layout from "./../../utils/layout";
export var LendingObligationLayout = BufferLayout.struct([
    /// Slot when obligation was updated. Used for calculating interest.
    Layout.uint64("lastUpdateSlot"),
    /// Amount of collateral tokens deposited for this obligation
    Layout.uint64("depositedCollateral"),
    /// Reserve which collateral tokens were deposited into
    Layout.publicKey("collateralReserve"),
    /// Borrow rate used for calculating interest.
    Layout.uint128("cumulativeBorrowRateWad"),
    /// Amount of tokens borrowed for this obligation plus interest
    Layout.uint128("borrowAmountWad"),
    /// Reserve which tokens were borrowed from
    Layout.publicKey("borrowReserve"),
    /// Mint address of the tokens for this obligation
    Layout.publicKey("tokenMint"),
]);
export var isLendingObligation = function (info) {
    return info.data.length === LendingObligationLayout.span;
};
export var LendingObligationParser = function (pubKey, info) {
    var buffer = Buffer.from(info.data);
    var data = LendingObligationLayout.decode(buffer);
    var details = {
        pubkey: pubKey,
        account: __assign({}, info),
        info: data,
    };
    return details;
};
