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
import { SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, TransactionInstruction, } from "@solana/web3.js";
import BN from "bn.js";
import * as BufferLayout from "buffer-layout";
import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID } from "../../constants/ids";
import { wadToLamports } from "../../utils/utils";
import * as Layout from "./../../utils/layout";
import { LendingInstruction } from "./lending";
export var LendingReserveLayout = BufferLayout.struct([
    Layout.uint64("lastUpdateSlot"),
    Layout.publicKey("lendingMarket"),
    Layout.publicKey("liquidityMint"),
    BufferLayout.u8("liquidityMintDecimals"),
    Layout.publicKey("liquiditySupply"),
    Layout.publicKey("collateralMint"),
    Layout.publicKey("collateralSupply"),
    // TODO: replace u32 option with generic quivalent
    BufferLayout.u32("dexMarketOption"),
    Layout.publicKey("dexMarket"),
    BufferLayout.struct([
        /// Optimal utilization rate as a percent
        BufferLayout.u8("optimalUtilizationRate"),
        /// The ratio of the loan to the value of the collateral as a percent
        BufferLayout.u8("loanToValueRatio"),
        /// The percent discount the liquidator gets when buying collateral for an unhealthy obligation
        BufferLayout.u8("liquidationBonus"),
        /// The percent at which an obligation is considered unhealthy
        BufferLayout.u8("liquidationThreshold"),
        /// Min borrow APY
        BufferLayout.u8("minBorrowRate"),
        /// Optimal (utilization) borrow APY
        BufferLayout.u8("optimalBorrowRate"),
        /// Max borrow APY
        BufferLayout.u8("maxBorrowRate"),
    ], "config"),
    Layout.uint128("cumulativeBorrowRateWad"),
    Layout.uint128("borrowedLiquidityWad"),
    Layout.uint64("availableLiquidity"),
    Layout.uint64("collateralMintSupply"),
]);
export var isLendingReserve = function (info) {
    return info.data.length === LendingReserveLayout.span;
};
export var LendingReserveParser = function (pubKey, info) {
    var buffer = Buffer.from(info.data);
    var data = LendingReserveLayout.decode(buffer);
    if (data.lastUpdateSlot.toNumber() === 0)
        return;
    var details = {
        pubkey: pubKey,
        account: __assign({}, info),
        info: data,
    };
    return details;
};
export var initReserveInstruction = function (liquidityAmount, maxUtilizationRate, from, // Liquidity input SPL Token account. $authority can transfer $liquidity_amount
to, // Collateral output SPL Token account,
reserveAccount, liquidityMint, liquiditySupply, collateralMint, collateralSupply, lendingMarket, lendingMarketAuthority, dexMarket // TODO: optional
) {
    var dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        Layout.uint64("liquidityAmount"),
        BufferLayout.u8("maxUtilizationRate"),
    ]);
    var data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: LendingInstruction.InitReserve,
        liquidityAmount: new BN(liquidityAmount),
        maxUtilizationRate: maxUtilizationRate,
    }, data);
    var keys = [
        { pubkey: from, isSigner: false, isWritable: true },
        { pubkey: to, isSigner: false, isWritable: true },
        { pubkey: reserveAccount, isSigner: false, isWritable: true },
        { pubkey: liquidityMint, isSigner: false, isWritable: false },
        { pubkey: liquiditySupply, isSigner: false, isWritable: true },
        { pubkey: collateralMint, isSigner: false, isWritable: true },
        { pubkey: collateralSupply, isSigner: false, isWritable: true },
        // NOTE: Why lending market needs to be a signer?
        { pubkey: lendingMarket, isSigner: true, isWritable: true },
        { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        // optionals
        { pubkey: dexMarket, isSigner: false, isWritable: false },
    ];
    return new TransactionInstruction({
        keys: keys,
        programId: LENDING_PROGRAM_ID,
        data: data,
    });
};
export var calculateUtilizationRatio = function (reserve) {
    var borrowedLiquidity = wadToLamports(reserve.borrowedLiquidityWad).toNumber();
    return (borrowedLiquidity /
        (reserve.availableLiquidity.toNumber() + borrowedLiquidity));
};
export var reserveMarketCap = function (reserve) {
    var available = (reserve === null || reserve === void 0 ? void 0 : reserve.availableLiquidity.toNumber()) || 0;
    var borrowed = wadToLamports(reserve === null || reserve === void 0 ? void 0 : reserve.borrowedLiquidityWad).toNumber();
    var total = available + borrowed;
    return total;
};
export var collateralExchangeRate = function (reserve) {
    return (((reserve === null || reserve === void 0 ? void 0 : reserve.collateralMintSupply.toNumber()) || 1) / reserveMarketCap(reserve));
};
export var collateralToLiquidity = function (collateralAmount, reserve) {
    var amount = typeof collateralAmount === "number"
        ? collateralAmount
        : collateralAmount.toNumber();
    return Math.floor(amount / collateralExchangeRate(reserve));
};
export var liquidityToCollateral = function (liquidityAmount, reserve) {
    var amount = typeof liquidityAmount === "number"
        ? liquidityAmount
        : liquidityAmount.toNumber();
    return Math.floor(amount * collateralExchangeRate(reserve));
};
