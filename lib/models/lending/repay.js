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
exports.repayInstruction = void 0;
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
const ids_1 = require("../../constants/ids");
const lending_1 = require("./lending");
const BufferLayout = __importStar(require("buffer-layout"));
const Layout = __importStar(require("./../../utils/layout"));
/// Repay loaned tokens to a reserve and receive collateral tokens. The obligation balance
/// will be recalculated for interest.
///
///   0. `[writable]` Liquidity input SPL Token account, $authority can transfer $liquidity_amount
///   1. `[writable]` Collateral output SPL Token account
///   2. `[writable]` Repay reserve account.
///   3. `[writable]` Repay reserve liquidity supply SPL Token account
///   4. `[]` Withdraw reserve account.
///   5. `[writable]` Withdraw reserve collateral supply SPL Token account
///   6. `[writable]` Obligation - initialized
///   7. `[writable]` Obligation token mint, $authority can transfer calculated amount
///   8. `[writable]` Obligation token input
///   9. `[]` Derived lending market authority ($authority).
///   10 `[]` Clock sysvar
///   11 `[]` Token program id
const repayInstruction = (liquidityAmount, from, // Liquidity input SPL Token account. $authority can transfer $liquidity_amount
to, // Collateral output SPL Token account,
repayReserveAccount, repayReserveLiquiditySupply, withdrawReserve, withdrawReserveCollateralSupply, obligation, obligationMint, obligationInput, authority) => {
    const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction'), Layout.uint64('liquidityAmount')]);
    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: lending_1.LendingInstruction.RepayOblogationLiquidity,
        liquidityAmount: new bn_js_1.default(liquidityAmount),
    }, data);
    const keys = [
        { pubkey: from, isSigner: false, isWritable: true },
        { pubkey: to, isSigner: false, isWritable: true },
        { pubkey: repayReserveAccount, isSigner: false, isWritable: true },
        { pubkey: repayReserveLiquiditySupply, isSigner: false, isWritable: true },
        { pubkey: withdrawReserve, isSigner: false, isWritable: false },
        {
            pubkey: withdrawReserveCollateralSupply,
            isSigner: false,
            isWritable: true,
        },
        { pubkey: obligation, isSigner: false, isWritable: true },
        { pubkey: obligationMint, isSigner: false, isWritable: true },
        { pubkey: obligationInput, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: false, isWritable: false },
        { pubkey: web3_js_1.SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: ids_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
    return new web3_js_1.TransactionInstruction({
        keys,
        programId: ids_1.LENDING_PROGRAM_ID,
        data,
    });
};
exports.repayInstruction = repayInstruction;
