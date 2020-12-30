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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.liquidityToCollateral = exports.collateralToLiquidity = exports.collateralExchangeRate = exports.reserveMarketCap = exports.calculateUtilizationRatio = exports.initReserveInstruction = exports.LendingReserveParser = exports.isLendingReserve = exports.LendingReserveLayout = void 0;
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
const BufferLayout = __importStar(require("buffer-layout"));
const ids_1 = require("../../constants/ids");
const utils_1 = require("../../utils/utils");
const Layout = __importStar(require("./../../utils/layout"));
const lending_1 = require("./lending");
exports.LendingReserveLayout = BufferLayout.struct([
    Layout.uint64('lastUpdateSlot'),
    Layout.publicKey('lendingMarket'),
    Layout.publicKey('liquidityMint'),
    BufferLayout.u8('liquidityMintDecimals'),
    Layout.publicKey('liquiditySupply'),
    Layout.publicKey('collateralMint'),
    Layout.publicKey('collateralSupply'),
    // TODO: replace u32 option with generic quivalent
    BufferLayout.u32('dexMarketOption'),
    Layout.publicKey('dexMarket'),
    BufferLayout.struct([
        /// Optimal utilization rate as a percent
        BufferLayout.u8('optimalUtilizationRate'),
        /// The ratio of the loan to the value of the collateral as a percent
        BufferLayout.u8('loanToValueRatio'),
        /// The percent discount the liquidator gets when buying collateral for an unhealthy obligation
        BufferLayout.u8('liquidationBonus'),
        /// The percent at which an obligation is considered unhealthy
        BufferLayout.u8('liquidationThreshold'),
        /// Min borrow APY
        BufferLayout.u8('minBorrowRate'),
        /// Optimal (utilization) borrow APY
        BufferLayout.u8('optimalBorrowRate'),
        /// Max borrow APY
        BufferLayout.u8('maxBorrowRate'),
    ], 'config'),
    Layout.uint128('cumulativeBorrowRateWad'),
    Layout.uint128('borrowedLiquidityWad'),
    Layout.uint64('availableLiquidity'),
    Layout.uint64('collateralMintSupply'),
]);
const isLendingReserve = (info) => {
    return info.data.length === exports.LendingReserveLayout.span;
};
exports.isLendingReserve = isLendingReserve;
const LendingReserveParser = (pubKey, info) => {
    const buffer = Buffer.from(info.data);
    const data = exports.LendingReserveLayout.decode(buffer);
    if (data.lastUpdateSlot.toNumber() === 0)
        return;
    const details = {
        pubkey: pubKey,
        account: {
            ...info,
        },
        info: data,
    };
    return details;
};
exports.LendingReserveParser = LendingReserveParser;
const initReserveInstruction = (liquidityAmount, maxUtilizationRate, from, // Liquidity input SPL Token account. $authority can transfer $liquidity_amount
to, // Collateral output SPL Token account,
reserveAccount, liquidityMint, liquiditySupply, collateralMint, collateralSupply, lendingMarket, lendingMarketAuthority, dexMarket) => {
    const dataLayout = BufferLayout.struct([
        BufferLayout.u8('instruction'),
        Layout.uint64('liquidityAmount'),
        BufferLayout.u8('maxUtilizationRate'),
    ]);
    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: lending_1.LendingInstruction.InitReserve,
        liquidityAmount: new bn_js_1.default(liquidityAmount),
        maxUtilizationRate: maxUtilizationRate,
    }, data);
    const keys = [
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
        { pubkey: web3_js_1.SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: ids_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        // optionals
        { pubkey: dexMarket, isSigner: false, isWritable: false },
    ];
    return new web3_js_1.TransactionInstruction({
        keys,
        programId: ids_1.LENDING_PROGRAM_ID,
        data,
    });
};
exports.initReserveInstruction = initReserveInstruction;
const calculateUtilizationRatio = (reserve) => {
    let borrowedLiquidity = utils_1.wadToLamports(reserve.borrowedLiquidityWad).toNumber();
    return borrowedLiquidity / (reserve.availableLiquidity.toNumber() + borrowedLiquidity);
};
exports.calculateUtilizationRatio = calculateUtilizationRatio;
const reserveMarketCap = (reserve) => {
    const available = reserve?.availableLiquidity.toNumber() || 0;
    const borrowed = utils_1.wadToLamports(reserve?.borrowedLiquidityWad).toNumber();
    const total = available + borrowed;
    return total;
};
exports.reserveMarketCap = reserveMarketCap;
const collateralExchangeRate = (reserve) => {
    return (reserve?.collateralMintSupply.toNumber() || 1) / exports.reserveMarketCap(reserve);
};
exports.collateralExchangeRate = collateralExchangeRate;
const collateralToLiquidity = (collateralAmount, reserve) => {
    const amount = typeof collateralAmount === 'number' ? collateralAmount : collateralAmount.toNumber();
    return Math.floor(amount / exports.collateralExchangeRate(reserve));
};
exports.collateralToLiquidity = collateralToLiquidity;
const liquidityToCollateral = (liquidityAmount, reserve) => {
    const amount = typeof liquidityAmount === 'number' ? liquidityAmount : liquidityAmount.toNumber();
    return Math.floor(amount * exports.collateralExchangeRate(reserve));
};
exports.liquidityToCollateral = liquidityToCollateral;
