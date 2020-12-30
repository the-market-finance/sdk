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
exports.calculateBorrowAPY = exports.borrowInstruction = exports.BorrowAmountType = void 0;
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
const BufferLayout = __importStar(require("buffer-layout"));
const ids_1 = require("../../constants/ids");
const utils_1 = require("../../utils/utils");
const Layout = __importStar(require("./../../utils/layout"));
const lending_1 = require("./lending");
var BorrowAmountType;
(function (BorrowAmountType) {
    BorrowAmountType[BorrowAmountType["LiquidityBorrowAmount"] = 0] = "LiquidityBorrowAmount";
    BorrowAmountType[BorrowAmountType["CollateralDepositAmount"] = 1] = "CollateralDepositAmount";
})(BorrowAmountType = exports.BorrowAmountType || (exports.BorrowAmountType = {}));
/// Borrow tokens from a reserve by depositing collateral tokens. The number of borrowed tokens
/// is calculated by market price. The debt obligation is tokenized.
///
///   0. `[writable]` Collateral input SPL Token account, $authority can transfer $collateral_amount
///   1. `[writable]` Liquidity output SPL Token account
///   2. `[writable]` Deposit reserve account.
///   3. `[writable]` Deposit reserve collateral supply SPL Token account
///   4. `[writable]` Borrow reserve account.
///   5. `[writable]` Borrow reserve liquidity supply SPL Token account
///   6. `[writable]` Obligation - uninitialized
///   7. `[writable]` Obligation token mint - uninitialized
///   8. `[writable]` Obligation token output - uninitialized
///   9. `[]` Obligation token owner
///   10 `[]` Derived lending market authority ($authority).
///   11 `[]` Dex market
///   12 `[]` Dex order book side // could be bid/ask
///   13 `[]` Temporary memory
///   14 `[]` Clock sysvar
///   15 `[]` Rent sysvar
///   16 '[]` Token program id
const borrowInstruction = (amount, amountType, from, // Collateral input SPL Token account. $authority can transfer $collateralAmount
to, // Liquidity output SPL Token account,
depositReserve, depositReserveCollateralSupply, borrowReserve, borrowReserveLiquiditySupply, obligation, obligationMint, obligationTokenOutput, obligationTokenOwner, lendingMarketAuthority, dexMarket, dexOrderBookSide, memory) => {
    const dataLayout = BufferLayout.struct([
        BufferLayout.u8('instruction'),
        Layout.uint64('amount'),
        BufferLayout.u8('amountType'),
    ]);
    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: lending_1.LendingInstruction.BorrowLiquidity,
        amount: new bn_js_1.default(amount),
        amountType,
    }, data);
    const keys = [
        { pubkey: from, isSigner: false, isWritable: true },
        { pubkey: to, isSigner: false, isWritable: true },
        { pubkey: depositReserve, isSigner: false, isWritable: true },
        {
            pubkey: depositReserveCollateralSupply,
            isSigner: false,
            isWritable: true,
        },
        { pubkey: borrowReserve, isSigner: false, isWritable: true },
        {
            pubkey: borrowReserveLiquiditySupply,
            isSigner: false,
            isWritable: true,
        },
        { pubkey: obligation, isSigner: false, isWritable: true },
        { pubkey: obligationMint, isSigner: false, isWritable: true },
        { pubkey: obligationTokenOutput, isSigner: false, isWritable: true },
        { pubkey: obligationTokenOwner, isSigner: false, isWritable: false },
        { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
        { pubkey: dexMarket, isSigner: false, isWritable: false },
        { pubkey: dexOrderBookSide, isSigner: false, isWritable: false },
        { pubkey: memory, isSigner: false, isWritable: false },
        { pubkey: web3_js_1.SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: ids_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
    return new web3_js_1.TransactionInstruction({
        keys,
        programId: ids_1.LENDING_PROGRAM_ID,
        data,
    });
};
exports.borrowInstruction = borrowInstruction;
// deposit APY utilization currentUtilizationRate * borrowAPY
const calculateBorrowAPY = (reserve) => {
    const totalBorrows = utils_1.wadToLamports(reserve.borrowedLiquidityWad).toNumber();
    const currentUtilization = totalBorrows / (reserve.availableLiquidity.toNumber() + totalBorrows);
    const optimalUtilization = reserve.config.optimalUtilizationRate / 100;
    let borrowAPY;
    if (optimalUtilization === 1.0 || currentUtilization < optimalUtilization) {
        const normalizedFactor = currentUtilization / optimalUtilization;
        const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
        const minBorrowRate = reserve.config.minBorrowRate / 100;
        borrowAPY = normalizedFactor * (optimalBorrowRate - minBorrowRate) + minBorrowRate;
    }
    else {
        const normalizedFactor = (currentUtilization - optimalUtilization) / (1 - optimalUtilization);
        const optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
        const maxBorrowRate = reserve.config.maxBorrowRate / 100;
        borrowAPY = normalizedFactor * (maxBorrowRate - optimalBorrowRate) + optimalBorrowRate;
    }
    return borrowAPY;
};
exports.calculateBorrowAPY = calculateBorrowAPY;
