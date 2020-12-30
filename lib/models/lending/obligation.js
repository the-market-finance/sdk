"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LendingObligationParser = exports.isLendingObligation = exports.LendingObligationLayout = void 0;
const BufferLayout = __importStar(require("buffer-layout"));
const Layout = __importStar(require("./../../utils/layout"));
exports.LendingObligationLayout = BufferLayout.struct([
    /// Slot when obligation was updated. Used for calculating interest.
    Layout.uint64('lastUpdateSlot'),
    /// Amount of collateral tokens deposited for this obligation
    Layout.uint64('depositedCollateral'),
    /// Reserve which collateral tokens were deposited into
    Layout.publicKey('collateralReserve'),
    /// Borrow rate used for calculating interest.
    Layout.uint128('cumulativeBorrowRateWad'),
    /// Amount of tokens borrowed for this obligation plus interest
    Layout.uint128('borrowAmountWad'),
    /// Reserve which tokens were borrowed from
    Layout.publicKey('borrowReserve'),
    /// Mint address of the tokens for this obligation
    Layout.publicKey('tokenMint'),
]);
const isLendingObligation = (info) => {
    return info.data.length === exports.LendingObligationLayout.span;
};
exports.isLendingObligation = isLendingObligation;
const LendingObligationParser = (pubKey, info) => {
    const buffer = Buffer.from(info.data);
    const data = exports.LendingObligationLayout.decode(buffer);
    const details = {
        pubkey: pubKey,
        account: {
            ...info,
        },
        info: data,
    };
    return details;
};
exports.LendingObligationParser = LendingObligationParser;
