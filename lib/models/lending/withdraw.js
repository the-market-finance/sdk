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
exports.withdrawInstruction = void 0;
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
const BufferLayout = __importStar(require("buffer-layout"));
const ids_1 = require("../../constants/ids");
const Layout = __importStar(require("./../../utils/layout"));
const lending_1 = require("./lending");
const withdrawInstruction = (collateralAmount, from, // Collateral input SPL Token account. $authority can transfer $liquidity_amount
to, // Liquidity output SPL Token account,
reserveAccount, collateralMint, reserveSupply, authority) => {
    const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction'), Layout.uint64('collateralAmount')]);
    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: lending_1.LendingInstruction.WithdrawReserveLiquidity,
        collateralAmount: new bn_js_1.default(collateralAmount),
    }, data);
    const keys = [
        { pubkey: from, isSigner: false, isWritable: true },
        { pubkey: to, isSigner: false, isWritable: true },
        { pubkey: reserveAccount, isSigner: false, isWritable: true },
        { pubkey: collateralMint, isSigner: false, isWritable: true },
        { pubkey: reserveSupply, isSigner: false, isWritable: true },
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
exports.withdrawInstruction = withdrawInstruction;
