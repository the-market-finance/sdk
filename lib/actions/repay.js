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
import { PublicKey, } from "@solana/web3.js";
import { repayInstruction } from "../models/lending/repay";
import { AccountLayout, Token } from "@solana/spl-token";
import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID } from "../constants";
import { findOrCreateAccountByMint } from "./account";
import { sendTransaction } from "../contexts/connection";
export var repay = function (from, // CollateralAccount
amountLamports, // in collateral token (lamports)
// which loan to repay
obligation, obligationToken, repayReserve, withdrawReserve, connection, wallet) { return __awaiter(void 0, void 0, void 0, function () {
    var signers, instructions, cleanupInstructions, accountRentExempt, _a, authority, fromAccount, toAccount, tx;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log({
                    message: "Repaing funds...",
                    description: "Please review transactions to approve.",
                    type: "warn",
                });
                signers = [];
                instructions = [];
                cleanupInstructions = [];
                return [4 /*yield*/, connection.getMinimumBalanceForRentExemption(AccountLayout.span)];
            case 1:
                accountRentExempt = _b.sent();
                return [4 /*yield*/, PublicKey.findProgramAddress([repayReserve.info.lendingMarket.toBuffer()], LENDING_PROGRAM_ID)];
            case 2:
                _a = __read.apply(void 0, [_b.sent(), 1]), authority = _a[0];
                fromAccount = from.pubkey;
                // create approval for transfer transactions
                instructions.push(Token.createApproveInstruction(TOKEN_PROGRAM_ID, fromAccount, authority, wallet.publicKey, [], amountLamports));
                return [4 /*yield*/, findOrCreateAccountByMint(wallet.publicKey, wallet.publicKey, instructions, cleanupInstructions, accountRentExempt, withdrawReserve.info.collateralMint, signers)];
            case 3:
                toAccount = _b.sent();
                // create approval for transfer transactions
                instructions.push(Token.createApproveInstruction(TOKEN_PROGRAM_ID, obligationToken.pubkey, authority, wallet.publicKey, [], obligationToken.info.amount.toNumber()));
                // TODO: add obligation
                instructions.push(repayInstruction(amountLamports, fromAccount, toAccount, repayReserve.pubkey, repayReserve.info.liquiditySupply, withdrawReserve.pubkey, withdrawReserve.info.collateralSupply, obligation.pubkey, obligation.info.tokenMint, obligationToken.pubkey, authority));
                return [4 /*yield*/, sendTransaction(connection, wallet, instructions.concat(cleanupInstructions), signers, true)];
            case 4:
                tx = _b.sent();
                return [2 /*return*/, {
                        message: "Funds repaid.",
                        type: "success",
                        description: "Transaction - " + tx.slice(0, 7) + "..." + tx.slice(-7),
                        full_description: "Transaction - " + tx,
                    }];
        }
    });
}); };
