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
import { clusterApiUrl, Transaction } from '@solana/web3.js';
export var ENDPOINTS = [
    {
        name: 'mainnet-beta',
        endpoint: 'https://solana-api.projectserum.com/',
    },
    {
        name: 'lending',
        endpoint: 'https://tln.solana.com',
    },
    { name: 'testnet', endpoint: clusterApiUrl('testnet') },
    { name: 'devnet', endpoint: clusterApiUrl('devnet') },
    { name: 'localnet', endpoint: 'http://127.0.0.1:8899' },
];
var DEFAULT = ENDPOINTS[0].endpoint;
var DEFAULT_SLIPPAGE = 0.25;
var getErrorForTransaction = function (connection, txid) { return __awaiter(void 0, void 0, void 0, function () {
    var tx, errors;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // wait for all confirmation before geting transaction
            return [4 /*yield*/, connection.confirmTransaction(txid, 'max')];
            case 1:
                // wait for all confirmation before geting transaction
                _a.sent();
                return [4 /*yield*/, connection.getParsedConfirmedTransaction(txid)];
            case 2:
                tx = _a.sent();
                errors = [];
                if ((tx === null || tx === void 0 ? void 0 : tx.meta) && tx.meta.logMessages) {
                    tx.meta.logMessages.forEach(function (log) {
                        var regex = /Error: (.*)/gm;
                        var m;
                        while ((m = regex.exec(log)) !== null) {
                            // This is necessary to avoid infinite loops with zero-width matches
                            if (m.index === regex.lastIndex) {
                                regex.lastIndex++;
                            }
                            if (m.length > 1) {
                                errors.push(m[1]);
                            }
                        }
                    });
                }
                return [2 /*return*/, errors];
        }
    });
}); };
export var sendTransaction = function (connection, wallet, instructions, signers, awaitConfirmation) {
    if (awaitConfirmation === void 0) { awaitConfirmation = true; }
    return __awaiter(void 0, void 0, void 0, function () {
        var transaction, _a, rawTransaction, options, txid, status_1, errors;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    transaction = new Transaction();
                    instructions.forEach(function (instruction) { return transaction.add(instruction); });
                    _a = transaction;
                    return [4 /*yield*/, connection.getRecentBlockhash('max')];
                case 1:
                    _a.recentBlockhash = (_b.sent()).blockhash;
                    transaction.setSigners.apply(transaction, __spread([
                        // fee payied by the wallet owner
                        wallet.publicKey], signers.map(function (s) { return s.publicKey; })));
                    if (signers.length > 0) {
                        transaction.partialSign.apply(transaction, __spread(signers));
                    }
                    return [4 /*yield*/, wallet.signTransaction(transaction)];
                case 2:
                    transaction = _b.sent();
                    rawTransaction = transaction.serialize();
                    options = {
                        skipPreflight: true,
                        commitment: 'singleGossip',
                    };
                    return [4 /*yield*/, connection.sendRawTransaction(rawTransaction, options)];
                case 3:
                    txid = _b.sent();
                    if (!awaitConfirmation) return [3 /*break*/, 6];
                    return [4 /*yield*/, connection.confirmTransaction(txid, options && options.commitment)];
                case 4:
                    status_1 = (_b.sent()).value;
                    if (!(status_1 === null || status_1 === void 0 ? void 0 : status_1.err)) return [3 /*break*/, 6];
                    return [4 /*yield*/, getErrorForTransaction(connection, txid)];
                case 5:
                    errors = _b.sent();
                    throw new Error("Raw transaction " + txid + " failed (" + JSON.stringify(status_1) + ")");
                case 6: return [2 /*return*/, txid];
            }
        });
    });
};
