var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
import { PublicKey, } from "@solana/web3.js";
import { AccountLayout, MintLayout, Token } from "@solana/spl-token";
import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID } from "../constants";
import { createTempMemoryAccount, createUninitializedAccount, createUninitializedMint, createUninitializedObligation, ensureSplAccount, findOrCreateAccountByMint, } from "./account";
import { cache, MintParser } from "../contexts/accounts";
import { LendingObligationLayout, borrowInstruction, BorrowAmountType, } from "../models";
import { toLamports } from "../utils/utils";
import { sendTransaction } from "../contexts/connection";
export var borrow = function (connection, wallet, from, amount, amountType, borrowReserve, depositReserve, existingObligation, obligationAccount) { return __awaiter(void 0, void 0, void 0, function () {
    var signers, instructions, cleanupInstructions, accountRentExempt, obligation, _a, _b, _c, obligationMint, _d, _e, _f, obligationTokenOutput, toAccount, tx, _g, authority, amountLamports, fromLamports, approvedAmount, mint, mint, fromAccount, dexMarketAddress, dexMarket, market, dexOrderBookSide, memory, tx, _h;
    return __generator(this, function (_j) {
        switch (_j.label) {
            case 0:
                console.log({
                    message: "Borrowing funds...",
                    description: "Please review transactions to approve.",
                    type: "warn",
                });
                signers = [];
                instructions = [];
                cleanupInstructions = [];
                return [4 /*yield*/, connection.getMinimumBalanceForRentExemption(AccountLayout.span)];
            case 1:
                accountRentExempt = _j.sent();
                if (!existingObligation) return [3 /*break*/, 2];
                _a = existingObligation.pubkey;
                return [3 /*break*/, 4];
            case 2:
                _b = createUninitializedObligation;
                _c = [instructions,
                    wallet.publicKey];
                return [4 /*yield*/, connection.getMinimumBalanceForRentExemption(LendingObligationLayout.span)];
            case 3:
                _a = _b.apply(void 0, _c.concat([_j.sent(), signers]));
                _j.label = 4;
            case 4:
                obligation = _a;
                if (!existingObligation) return [3 /*break*/, 5];
                _d = existingObligation.info.tokenMint;
                return [3 /*break*/, 7];
            case 5:
                _e = createUninitializedMint;
                _f = [instructions,
                    wallet.publicKey];
                return [4 /*yield*/, connection.getMinimumBalanceForRentExemption(MintLayout.span)];
            case 6:
                _d = _e.apply(void 0, _f.concat([_j.sent(), signers]));
                _j.label = 7;
            case 7:
                obligationMint = _d;
                obligationTokenOutput = obligationAccount
                    ? obligationAccount
                    : createUninitializedAccount(instructions, wallet.publicKey, accountRentExempt, signers);
                return [4 /*yield*/, findOrCreateAccountByMint(wallet.publicKey, wallet.publicKey, instructions, cleanupInstructions, accountRentExempt, borrowReserve.info.liquidityMint, signers)];
            case 8:
                toAccount = _j.sent();
                if (!(instructions.length > 0)) return [3 /*break*/, 10];
                return [4 /*yield*/, sendTransaction(connection, wallet, instructions, __spread(signers))];
            case 9:
                tx = _j.sent();
                console.log({
                    message: "Obligation accounts created",
                    description: "Transaction " + tx,
                    type: "success",
                });
                _j.label = 10;
            case 10:
                console.log({
                    message: "Borrowing funds...",
                    description: "Please review transactions to approve.",
                    type: "warn",
                });
                signers = [];
                instructions = [];
                cleanupInstructions = [];
                return [4 /*yield*/, PublicKey.findProgramAddress([depositReserve.info.lendingMarket.toBuffer()], LENDING_PROGRAM_ID)];
            case 11:
                _g = __read.apply(void 0, [_j.sent(), 1]), authority = _g[0];
                amountLamports = 0;
                fromLamports = 0;
                if (!(amountType === BorrowAmountType.LiquidityBorrowAmount)) return [3 /*break*/, 13];
                approvedAmount = from.info.amount.toNumber();
                fromLamports = approvedAmount - accountRentExempt;
                return [4 /*yield*/, cache.query(connection, borrowReserve.info.liquidityMint, MintParser)];
            case 12:
                mint = (_j.sent());
                amountLamports = toLamports(amount, mint === null || mint === void 0 ? void 0 : mint.info);
                return [3 /*break*/, 15];
            case 13:
                if (!(amountType === BorrowAmountType.CollateralDepositAmount)) return [3 /*break*/, 15];
                return [4 /*yield*/, cache.query(connection, depositReserve.info.collateralMint, MintParser)];
            case 14:
                mint = (_j.sent());
                amountLamports = toLamports(amount, mint === null || mint === void 0 ? void 0 : mint.info);
                fromLamports = amountLamports;
                _j.label = 15;
            case 15:
                fromAccount = ensureSplAccount(instructions, cleanupInstructions, from, wallet.publicKey, fromLamports + accountRentExempt, signers);
                // create approval for transfer transactions
                instructions.push(Token.createApproveInstruction(TOKEN_PROGRAM_ID, fromAccount, authority, wallet.publicKey, [], fromLamports));
                dexMarketAddress = borrowReserve.info.dexMarketOption
                    ? borrowReserve.info.dexMarket
                    : depositReserve.info.dexMarket;
                dexMarket = cache.get(dexMarketAddress);
                if (!dexMarket) {
                    throw new Error("Dex market doesn't exist.");
                }
                market = cache.get(depositReserve.info.lendingMarket);
                dexOrderBookSide = market.info.quoteMint.equals(depositReserve.info.liquidityMint)
                    ? dexMarket === null || dexMarket === void 0 ? void 0 : dexMarket.info.bids : dexMarket === null || dexMarket === void 0 ? void 0 : dexMarket.info.asks;
                memory = createTempMemoryAccount(instructions, wallet.publicKey, signers);
                // deposit
                instructions.push(borrowInstruction(amountLamports, amountType, fromAccount, toAccount, depositReserve.pubkey, depositReserve.info.collateralSupply, borrowReserve.pubkey, borrowReserve.info.liquiditySupply, obligation, obligationMint, obligationTokenOutput, wallet.publicKey, authority, dexMarketAddress, dexOrderBookSide, memory));
                _j.label = 16;
            case 16:
                _j.trys.push([16, 18, , 19]);
                return [4 /*yield*/, sendTransaction(connection, wallet, instructions.concat(cleanupInstructions), signers, true)];
            case 17:
                tx = _j.sent();
                return [2 /*return*/, {
                        message: "Funds borrowed.",
                        type: "success",
                        description: "Transaction - " + tx.slice(0, 7) + "..." + tx.slice(-7),
                        full_description: "Transaction - " + tx
                    }];
            case 18:
                _h = _j.sent();
                // TODO:
                throw new Error();
            case 19: return [2 /*return*/];
        }
    });
}); };
