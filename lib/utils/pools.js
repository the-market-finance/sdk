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
import { Account, PublicKey, SystemProgram, } from "@solana/web3.js";
import { Token, MintLayout, AccountLayout } from "@solana/spl-token";
import { cache, getCachedAccount, } from "./accounts";
import { createInitSwapInstruction, swapInstruction, depositExactOneInstruction, withdrawExactOneInstruction, withdrawInstruction, depositInstruction } from "../models/tokenSwap";
import { programIds, SWAP_HOST_FEE_ADDRESS, SWAP_PROGRAM_OWNER_FEE_ADDRESS, WRAPPED_SOL_MINT } from "../constants";
import { sendTransaction } from "../contexts/connection";
var LIQUIDITY_TOKEN_PRECISION = 8;
export var LIQUIDITY_PROVIDER_FEE = 0.003;
export var SERUM_FEE = 0.0005;
export var removeLiquidity = function (connection, wallet, liquidityAmount, account, pool) { return __awaiter(void 0, void 0, void 0, function () {
    var minAmount0, minAmount1, poolMint, accountA, accountB, authority, signers, instructions, cleanupInstructions, accountRentExempt, toAccounts, _a, deleteAccount, tx;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!pool) {
                    throw new Error("Pool is required");
                }
                console.log({
                    message: "Removing Liquidity...",
                    description: "Please review transactions to approve.",
                    type: "warn",
                });
                minAmount0 = 0;
                minAmount1 = 0;
                return [4 /*yield*/, cache.queryMint(connection, pool.pubkeys.mint)];
            case 1:
                poolMint = _b.sent();
                return [4 /*yield*/, cache.queryAccount(connection, pool.pubkeys.holdingAccounts[0])];
            case 2:
                accountA = _b.sent();
                return [4 /*yield*/, cache.queryAccount(connection, pool.pubkeys.holdingAccounts[1])];
            case 3:
                accountB = _b.sent();
                if (!poolMint.mintAuthority) {
                    throw new Error("Mint doesnt have authority");
                }
                authority = poolMint.mintAuthority;
                signers = [];
                instructions = [];
                cleanupInstructions = [];
                return [4 /*yield*/, connection.getMinimumBalanceForRentExemption(AccountLayout.span)];
            case 4:
                accountRentExempt = _b.sent();
                return [4 /*yield*/, findOrCreateAccountByMint(wallet.publicKey, wallet.publicKey, instructions, cleanupInstructions, accountRentExempt, accountA.info.mint, signers)];
            case 5:
                _a = [
                    _b.sent()
                ];
                return [4 /*yield*/, findOrCreateAccountByMint(wallet.publicKey, wallet.publicKey, instructions, cleanupInstructions, accountRentExempt, accountB.info.mint, signers)];
            case 6:
                toAccounts = _a.concat([
                    _b.sent()
                ]);
                approveAmount(instructions, cleanupInstructions, account.pubkey, authority, wallet.publicKey, liquidityAmount);
                // withdraw
                instructions.push(withdrawInstruction(pool.pubkeys.account, authority, pool.pubkeys.mint, pool.pubkeys.feeAccount, account.pubkey, pool.pubkeys.holdingAccounts[0], pool.pubkeys.holdingAccounts[1], toAccounts[0], toAccounts[1], pool.pubkeys.program, programIds().token, liquidityAmount, minAmount0, minAmount1));
                deleteAccount = liquidityAmount === account.info.amount.toNumber();
                if (deleteAccount) {
                    instructions.push(Token.createCloseAccountInstruction(programIds().token, account.pubkey, authority, wallet.publicKey, []));
                }
                return [4 /*yield*/, sendTransaction(connection, wallet, instructions.concat(cleanupInstructions), signers)];
            case 7:
                tx = _b.sent();
                if (deleteAccount) {
                    cache.deleteAccount(account.pubkey);
                }
                console.log({
                    message: "Liquidity Returned. Thank you for your support.",
                    type: "success",
                    description: "Transaction - " + tx,
                });
                return [2 /*return*/, [
                        accountA.info.mint.equals(WRAPPED_SOL_MINT)
                            ? wallet.publicKey
                            : toAccounts[0],
                        accountB.info.mint.equals(WRAPPED_SOL_MINT)
                            ? wallet.publicKey
                            : toAccounts[1],
                    ]];
        }
    });
}); };
export var removeExactOneLiquidity = function (connection, wallet, account, liquidityAmount, tokenAmount, tokenMint, pool) { return __awaiter(void 0, void 0, void 0, function () {
    var liquidityMaxAmount, poolMint, accountA, accountB, tokenMatchAccount, authority, signers, instructions, cleanupInstructions, accountRentExempt, toAccount, tx;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!pool) {
                    throw new Error("Pool is required");
                }
                console.log({
                    message: "Removing Liquidity...",
                    description: "Please review transactions to approve.",
                    type: "warn",
                });
                liquidityMaxAmount = liquidityAmount * (1 + SLIPPAGE);
                return [4 /*yield*/, cache.queryMint(connection, pool.pubkeys.mint)];
            case 1:
                poolMint = _a.sent();
                return [4 /*yield*/, cache.queryAccount(connection, pool.pubkeys.holdingAccounts[0])];
            case 2:
                accountA = _a.sent();
                return [4 /*yield*/, cache.queryAccount(connection, pool.pubkeys.holdingAccounts[1])];
            case 3:
                accountB = _a.sent();
                if (!poolMint.mintAuthority) {
                    throw new Error("Mint doesnt have authority");
                }
                tokenMatchAccount = tokenMint === pool.pubkeys.holdingMints[0].toBase58() ? accountA : accountB;
                authority = poolMint.mintAuthority;
                signers = [];
                instructions = [];
                cleanupInstructions = [];
                return [4 /*yield*/, connection.getMinimumBalanceForRentExemption(AccountLayout.span)];
            case 4:
                accountRentExempt = _a.sent();
                return [4 /*yield*/, findOrCreateAccountByMint(wallet.publicKey, wallet.publicKey, instructions, cleanupInstructions, accountRentExempt, tokenMatchAccount.info.mint, signers)];
            case 5:
                toAccount = _a.sent();
                approveAmount(instructions, cleanupInstructions, account.pubkey, authority, wallet.publicKey, account.info.amount.toNumber() // liquidityAmount <- need math tuning
                );
                // withdraw exact one
                instructions.push(withdrawExactOneInstruction(pool.pubkeys.account, authority, pool.pubkeys.mint, account.pubkey, pool.pubkeys.holdingAccounts[0], pool.pubkeys.holdingAccounts[1], toAccount, pool.pubkeys.feeAccount, pool.pubkeys.program, programIds().token, tokenAmount, liquidityMaxAmount));
                return [4 /*yield*/, sendTransaction(connection, wallet, instructions.concat(cleanupInstructions), signers)];
            case 6:
                tx = _a.sent();
                console.log({
                    message: "Liquidity Returned. Thank you for your support.",
                    type: "success",
                    description: "Transaction - " + tx,
                });
                return [2 /*return*/, tokenMatchAccount.info.mint.equals(WRAPPED_SOL_MINT)
                        ? wallet.publicKey
                        : toAccount];
        }
    });
}); };
export var swap = function (connection, wallet, components, SLIPPAGE, pool) { return __awaiter(void 0, void 0, void 0, function () {
    var amountIn, minAmountOut, holdingA, holdingB, poolMint, authority, instructions, cleanupInstructions, signers, accountRentExempt, fromAccount, toAccount, hostFeeAccount, tx;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!pool || !components[0].account) {
                    console.log({
                        type: "error",
                        message: "Pool doesn't exsist.",
                        description: "Swap trade cancelled",
                    });
                    return [2 /*return*/];
                }
                amountIn = components[0].amount;
                minAmountOut = components[1].amount * (1 - SLIPPAGE);
                holdingA = ((_a = pool.pubkeys.holdingMints[0]) === null || _a === void 0 ? void 0 : _a.toBase58()) ===
                    components[0].account.info.mint.toBase58()
                    ? pool.pubkeys.holdingAccounts[0]
                    : pool.pubkeys.holdingAccounts[1];
                holdingB = holdingA === pool.pubkeys.holdingAccounts[0]
                    ? pool.pubkeys.holdingAccounts[1]
                    : pool.pubkeys.holdingAccounts[0];
                return [4 /*yield*/, cache.queryMint(connection, pool.pubkeys.mint)];
            case 1:
                poolMint = _b.sent();
                if (!poolMint.mintAuthority || !pool.pubkeys.feeAccount) {
                    throw new Error("Mint doesnt have authority");
                }
                authority = poolMint.mintAuthority;
                instructions = [];
                cleanupInstructions = [];
                signers = [];
                return [4 /*yield*/, connection.getMinimumBalanceForRentExemption(AccountLayout.span)];
            case 2:
                accountRentExempt = _b.sent();
                fromAccount = getWrappedAccount(instructions, cleanupInstructions, components[0].account, wallet.publicKey, amountIn + accountRentExempt, signers);
                toAccount = findOrCreateAccountByMint(wallet.publicKey, wallet.publicKey, instructions, cleanupInstructions, accountRentExempt, new PublicKey(components[1].mintAddress), signers);
                // create approval for transfer transactions
                approveAmount(instructions, cleanupInstructions, fromAccount, authority, wallet.publicKey, amountIn);
                hostFeeAccount = SWAP_HOST_FEE_ADDRESS
                    ? findOrCreateAccountByMint(wallet.publicKey, SWAP_HOST_FEE_ADDRESS, instructions, cleanupInstructions, accountRentExempt, pool.pubkeys.mint, signers)
                    : undefined;
                // swap
                instructions.push(swapInstruction(pool.pubkeys.account, authority, fromAccount, holdingA, holdingB, toAccount, pool.pubkeys.mint, pool.pubkeys.feeAccount, pool.pubkeys.program, programIds().token, amountIn, minAmountOut, hostFeeAccount));
                return [4 /*yield*/, sendTransaction(connection, wallet, instructions.concat(cleanupInstructions), signers)];
            case 3:
                tx = _b.sent();
                console.log({
                    message: "Trade executed.",
                    type: "success",
                    description: "Transaction - " + tx,
                });
                return [2 /*return*/];
        }
    });
}); };
export var addLiquidity = function (connection, wallet, components, slippage, pool, options, depositType) {
    if (depositType === void 0) { depositType = "both"; }
    return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(depositType === "one" && pool)) return [3 /*break*/, 2];
                    return [4 /*yield*/, _addLiquidityExactOneExistingPool(pool, components[0], connection, wallet)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 2:
                    if (!!pool) return [3 /*break*/, 4];
                    if (!options) {
                        throw new Error("Options are required to create new pool.");
                    }
                    return [4 /*yield*/, _addLiquidityNewPool(wallet, connection, components, options)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, _addLiquidityExistingPool(pool, components, connection, wallet)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    });
};
var getHoldings = function (connection, accounts) {
    return accounts.map(function (acc) {
        return cache.queryAccount(connection, new PublicKey(acc));
    });
};
var toPoolInfo = function (item, program) {
    var mint = new PublicKey(item.data.tokenPool);
    return {
        pubkeys: {
            account: item.pubkey,
            program: program,
            mint: mint,
            holdingMints: [],
            holdingAccounts: [item.data.tokenAccountA, item.data.tokenAccountB].map(function (a) { return new PublicKey(a); }),
        },
        legacy: false,
        raw: item,
    };
};
// Allow for this much price movement in the pool before adding liquidity to the pool aborts
var SLIPPAGE = 0.005;
function _addLiquidityExistingPool(pool, components, connection, wallet) {
    return __awaiter(this, void 0, void 0, function () {
        var poolMint, accountA, accountB, reserve0, reserve1, fromA, fromB, supply, authority, amount0, amount1, liquidity, instructions, cleanupInstructions, signers, accountRentExempt, fromKeyA, fromKeyB, toAccount, tx;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log({
                        message: "Adding Liquidity...",
                        description: "Please review transactions to approve.",
                        type: "warn",
                    });
                    return [4 /*yield*/, cache.queryMint(connection, pool.pubkeys.mint)];
                case 1:
                    poolMint = _a.sent();
                    if (!poolMint.mintAuthority) {
                        throw new Error("Mint doesnt have authority");
                    }
                    if (!pool.pubkeys.feeAccount) {
                        throw new Error("Invald fee account");
                    }
                    return [4 /*yield*/, cache.queryAccount(connection, pool.pubkeys.holdingAccounts[0])];
                case 2:
                    accountA = _a.sent();
                    return [4 /*yield*/, cache.queryAccount(connection, pool.pubkeys.holdingAccounts[1])];
                case 3:
                    accountB = _a.sent();
                    reserve0 = accountA.info.amount.toNumber();
                    reserve1 = accountB.info.amount.toNumber();
                    fromA = accountA.info.mint.toBase58() === components[0].mintAddress
                        ? components[0]
                        : components[1];
                    fromB = fromA === components[0] ? components[1] : components[0];
                    if (!fromA.account || !fromB.account) {
                        throw new Error("Missing account info.");
                    }
                    supply = poolMint.supply.toNumber();
                    authority = poolMint.mintAuthority;
                    amount0 = fromA.amount;
                    amount1 = fromB.amount;
                    liquidity = Math.min((amount0 * (1 - SLIPPAGE) * supply) / reserve0, (amount1 * (1 - SLIPPAGE) * supply) / reserve1);
                    instructions = [];
                    cleanupInstructions = [];
                    signers = [];
                    return [4 /*yield*/, connection.getMinimumBalanceForRentExemption(AccountLayout.span)];
                case 4:
                    accountRentExempt = _a.sent();
                    fromKeyA = getWrappedAccount(instructions, cleanupInstructions, fromA.account, wallet.publicKey, amount0 + accountRentExempt, signers);
                    fromKeyB = getWrappedAccount(instructions, cleanupInstructions, fromB.account, wallet.publicKey, amount1 + accountRentExempt, signers);
                    toAccount = findOrCreateAccountByMint(wallet.publicKey, wallet.publicKey, instructions, [], accountRentExempt, pool.pubkeys.mint, signers, new Set([pool.pubkeys.feeAccount.toBase58()]));
                    // create approval for transfer transactions
                    approveAmount(instructions, cleanupInstructions, fromKeyA, authority, wallet.publicKey, amount0);
                    approveAmount(instructions, cleanupInstructions, fromKeyB, authority, wallet.publicKey, amount1);
                    // deposit
                    instructions.push(depositInstruction(pool.pubkeys.account, authority, fromKeyA, fromKeyB, pool.pubkeys.holdingAccounts[0], pool.pubkeys.holdingAccounts[1], pool.pubkeys.mint, toAccount, pool.pubkeys.program, programIds().token, liquidity, amount0, amount1));
                    return [4 /*yield*/, sendTransaction(connection, wallet, instructions.concat(cleanupInstructions), signers)];
                case 5:
                    tx = _a.sent();
                    console.log({
                        message: "Pool Funded. Happy trading.",
                        type: "success",
                        description: "Transaction - " + tx,
                    });
                    return [2 /*return*/];
            }
        });
    });
}
function _addLiquidityExactOneExistingPool(pool, component, connection, wallet) {
    return __awaiter(this, void 0, void 0, function () {
        var poolMint, accountA, accountB, from, reserve, supply, authority, amount, _liquidityTokenTempMath, liquidityToken, instructions, cleanupInstructions, signers, accountRentExempt, fromKey, toAccount, tx;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log({
                        message: "Adding Liquidity...",
                        description: "Please review transactions to approve.",
                        type: "warn",
                    });
                    return [4 /*yield*/, cache.queryMint(connection, pool.pubkeys.mint)];
                case 1:
                    poolMint = _a.sent();
                    if (!poolMint.mintAuthority) {
                        throw new Error("Mint doesnt have authority");
                    }
                    if (!pool.pubkeys.feeAccount) {
                        throw new Error("Invald fee account");
                    }
                    return [4 /*yield*/, cache.queryAccount(connection, pool.pubkeys.holdingAccounts[0])];
                case 2:
                    accountA = _a.sent();
                    return [4 /*yield*/, cache.queryAccount(connection, pool.pubkeys.holdingAccounts[1])];
                case 3:
                    accountB = _a.sent();
                    from = component;
                    if (!from.account) {
                        throw new Error("Missing account info.");
                    }
                    reserve = accountA.info.mint.toBase58() === from.mintAddress
                        ? accountA.info.amount.toNumber()
                        : accountB.info.amount.toNumber();
                    supply = poolMint.supply.toNumber();
                    authority = poolMint.mintAuthority;
                    amount = from.amount;
                    _liquidityTokenTempMath = (amount * (1 - SLIPPAGE) * supply) / reserve;
                    liquidityToken = 0;
                    instructions = [];
                    cleanupInstructions = [];
                    signers = [];
                    return [4 /*yield*/, connection.getMinimumBalanceForRentExemption(AccountLayout.span)];
                case 4:
                    accountRentExempt = _a.sent();
                    fromKey = getWrappedAccount(instructions, cleanupInstructions, from.account, wallet.publicKey, amount + accountRentExempt, signers);
                    toAccount = findOrCreateAccountByMint(wallet.publicKey, wallet.publicKey, instructions, [], accountRentExempt, pool.pubkeys.mint, signers, new Set([pool.pubkeys.feeAccount.toBase58()]));
                    // create approval for transfer transactions
                    approveAmount(instructions, cleanupInstructions, fromKey, authority, wallet.publicKey, amount);
                    // deposit
                    instructions.push(depositExactOneInstruction(pool.pubkeys.account, authority, fromKey, pool.pubkeys.holdingAccounts[0], pool.pubkeys.holdingAccounts[1], pool.pubkeys.mint, toAccount, pool.pubkeys.program, programIds().token, amount, liquidityToken));
                    return [4 /*yield*/, sendTransaction(connection, wallet, instructions.concat(cleanupInstructions), signers)];
                case 5:
                    tx = _a.sent();
                    console.log({
                        message: "Pool Funded. Happy trading.",
                        type: "success",
                        description: "Transaction - " + tx,
                    });
                    return [2 /*return*/];
            }
        });
    });
}
function findOrCreateAccountByMint(payer, owner, instructions, cleanupInstructions, accountRentExempt, mint, // use to identify same type
signers, excluded) {
    var accountToFind = mint.toBase58();
    var account = getCachedAccount(function (acc) {
        return acc.info.mint.toBase58() === accountToFind &&
            acc.info.owner.toBase58() === owner.toBase58() &&
            (excluded === undefined || !excluded.has(acc.pubkey.toBase58()));
    });
    var isWrappedSol = accountToFind === WRAPPED_SOL_MINT.toBase58();
    var toAccount;
    if (account && !isWrappedSol) {
        toAccount = account.pubkey;
    }
    else {
        // creating depositor pool account
        var newToAccount = createSplAccount(instructions, payer, accountRentExempt, mint, owner, AccountLayout.span);
        toAccount = newToAccount.publicKey;
        signers.push(newToAccount);
        if (isWrappedSol) {
            cleanupInstructions.push(Token.createCloseAccountInstruction(programIds().token, toAccount, payer, payer, []));
        }
    }
    return toAccount;
}
function estimateProceedsFromInput(inputQuantityInPool, proceedsQuantityInPool, inputAmount) {
    return ((proceedsQuantityInPool * inputAmount) / (inputQuantityInPool + inputAmount));
}
function estimateInputFromProceeds(inputQuantityInPool, proceedsQuantityInPool, proceedsAmount) {
    if (proceedsAmount >= proceedsQuantityInPool) {
        return "Not possible";
    }
    return ((inputQuantityInPool * proceedsAmount) /
        (proceedsQuantityInPool - proceedsAmount));
}
export var PoolOperation;
(function (PoolOperation) {
    PoolOperation[PoolOperation["Add"] = 0] = "Add";
    PoolOperation[PoolOperation["SwapGivenInput"] = 1] = "SwapGivenInput";
    PoolOperation[PoolOperation["SwapGivenProceeds"] = 2] = "SwapGivenProceeds";
})(PoolOperation || (PoolOperation = {}));
export function calculateDependentAmount(connection, independent, amount, pool, op) {
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function () {
        var poolMint, accountA, amountA, accountB, amountB, offsetAmount, offsetCurve, mintA, mintB, isFirstIndependent, depPrecision, indPrecision, indAdjustedAmount, indBasketQuantity, depBasketQuantity, depAdjustedAmount, constantPrice;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0: return [4 /*yield*/, cache.queryMint(connection, pool.pubkeys.mint)];
                case 1:
                    poolMint = _g.sent();
                    return [4 /*yield*/, cache.queryAccount(connection, pool.pubkeys.holdingAccounts[0])];
                case 2:
                    accountA = _g.sent();
                    amountA = accountA.info.amount.toNumber();
                    return [4 /*yield*/, cache.queryAccount(connection, pool.pubkeys.holdingAccounts[1])];
                case 3:
                    accountB = _g.sent();
                    amountB = accountB.info.amount.toNumber();
                    if (!poolMint.mintAuthority) {
                        throw new Error("Mint doesnt have authority");
                    }
                    if (poolMint.supply.eqn(0)) {
                        return [2 /*return*/];
                    }
                    offsetAmount = 0;
                    offsetCurve = (_c = (_b = (_a = pool.raw) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.curve) === null || _c === void 0 ? void 0 : _c.offset;
                    if (offsetCurve) {
                        offsetAmount = offsetCurve.token_b_offset;
                        amountB = amountB + offsetAmount;
                    }
                    return [4 /*yield*/, cache.queryMint(connection, accountA.info.mint)];
                case 4:
                    mintA = _g.sent();
                    return [4 /*yield*/, cache.queryMint(connection, accountB.info.mint)];
                case 5:
                    mintB = _g.sent();
                    if (!mintA || !mintB) {
                        return [2 /*return*/];
                    }
                    isFirstIndependent = accountA.info.mint.toBase58() === independent;
                    depPrecision = Math.pow(10, isFirstIndependent ? mintB.decimals : mintA.decimals);
                    indPrecision = Math.pow(10, isFirstIndependent ? mintA.decimals : mintB.decimals);
                    indAdjustedAmount = amount * indPrecision;
                    indBasketQuantity = isFirstIndependent ? amountA : amountB;
                    depBasketQuantity = isFirstIndependent ? amountB : amountA;
                    constantPrice = (_f = (_e = (_d = pool.raw) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.curve) === null || _f === void 0 ? void 0 : _f.constantPrice;
                    if (constantPrice) {
                        debugger;
                        depAdjustedAmount = (amount * depPrecision) / constantPrice.token_b_price;
                    }
                    else {
                        switch (+op) {
                            case PoolOperation.Add:
                                depAdjustedAmount =
                                    (depBasketQuantity / indBasketQuantity) * indAdjustedAmount;
                                break;
                            case PoolOperation.SwapGivenProceeds:
                                depAdjustedAmount = estimateInputFromProceeds(depBasketQuantity, indBasketQuantity, indAdjustedAmount);
                                break;
                            case PoolOperation.SwapGivenInput:
                                depAdjustedAmount = estimateProceedsFromInput(indBasketQuantity, depBasketQuantity, indAdjustedAmount);
                                break;
                        }
                    }
                    if (typeof depAdjustedAmount === "string") {
                        return [2 /*return*/, depAdjustedAmount];
                    }
                    if (depAdjustedAmount === undefined) {
                        return [2 /*return*/, undefined];
                    }
                    return [2 /*return*/, depAdjustedAmount / depPrecision];
            }
        });
    });
}
// TODO: add ui to customize curve type
function _addLiquidityNewPool(wallet, connection, components, options) {
    return __awaiter(this, void 0, void 0, function () {
        var instructions, cleanupInstructions, liquidityTokenMint, _a, _b, _c, _d, tokenSwapAccount, _e, authority, nonce, accountRentExempt, holdingAccounts, signers, depositorAccount, feeAccount, tx, _f, _g, _h, _j;
        var _k, _l;
        return __generator(this, function (_m) {
            switch (_m.label) {
                case 0:
                    console.log({
                        message: "Creating new pool...",
                        description: "Please review transactions to approve.",
                        type: "warn",
                    });
                    if (components.some(function (c) { return !c.account; })) {
                        console.log({
                            message: "You need to have balance for all legs in the basket...",
                            description: "Please review inputs.",
                            type: "error",
                        });
                        return [2 /*return*/];
                    }
                    instructions = [];
                    cleanupInstructions = [];
                    liquidityTokenMint = new Account();
                    // Create account for pool liquidity token
                    _b = (_a = instructions).push;
                    _d = (_c = SystemProgram).createAccount;
                    _k = {
                        fromPubkey: wallet.publicKey,
                        newAccountPubkey: liquidityTokenMint.publicKey
                    };
                    return [4 /*yield*/, connection.getMinimumBalanceForRentExemption(MintLayout.span)];
                case 1:
                    // Create account for pool liquidity token
                    _b.apply(_a, [_d.apply(_c, [(_k.lamports = _m.sent(),
                                _k.space = MintLayout.span,
                                _k.programId = programIds().token,
                                _k)])]);
                    tokenSwapAccount = new Account();
                    return [4 /*yield*/, PublicKey.findProgramAddress([tokenSwapAccount.publicKey.toBuffer()], programIds().swap)];
                case 2:
                    _e = __read.apply(void 0, [_m.sent(), 2]), authority = _e[0], nonce = _e[1];
                    // create mint for pool liquidity token
                    instructions.push(Token.createInitMintInstruction(programIds().token, liquidityTokenMint.publicKey, LIQUIDITY_TOKEN_PRECISION, 
                    // pass control of liquidity mint to swap program
                    authority, 
                    // swap program can freeze liquidity token mint
                    null));
                    return [4 /*yield*/, connection.getMinimumBalanceForRentExemption(AccountLayout.span)];
                case 3:
                    accountRentExempt = _m.sent();
                    holdingAccounts = [];
                    signers = [];
                    components.forEach(function (leg) {
                        if (!leg.account) {
                            return;
                        }
                        var mintPublicKey = leg.account.info.mint;
                        // component account to store tokens I of N in liquidity poll
                        holdingAccounts.push(createSplAccount(instructions, wallet.publicKey, accountRentExempt, mintPublicKey, authority, AccountLayout.span));
                    });
                    depositorAccount = createSplAccount(instructions, wallet.publicKey, accountRentExempt, liquidityTokenMint.publicKey, wallet.publicKey, AccountLayout.span);
                    feeAccount = createSplAccount(instructions, wallet.publicKey, accountRentExempt, liquidityTokenMint.publicKey, SWAP_PROGRAM_OWNER_FEE_ADDRESS || wallet.publicKey, AccountLayout.span);
                    return [4 /*yield*/, sendTransaction(connection, wallet, instructions, __spread([
                            liquidityTokenMint,
                            depositorAccount,
                            feeAccount
                        ], holdingAccounts, signers))];
                case 4:
                    tx = _m.sent();
                    console.log({
                        message: "Accounts created",
                        description: "Transaction " + tx,
                        type: "success",
                    });
                    console.log({
                        message: "Adding Liquidity...",
                        description: "Please review transactions to approve.",
                        type: "warn",
                    });
                    signers = [];
                    instructions = [];
                    cleanupInstructions = [];
                    _g = (_f = instructions).push;
                    _j = (_h = SystemProgram).createAccount;
                    _l = {
                        fromPubkey: wallet.publicKey,
                        newAccountPubkey: tokenSwapAccount.publicKey
                    };
                    return [4 /*yield*/, connection.getMinimumBalanceForRentExemption(programIds().swapLayout.span)];
                case 5:
                    _g.apply(_f, [_j.apply(_h, [(_l.lamports = _m.sent(),
                                _l.space = programIds().swapLayout.span,
                                _l.programId = programIds().swap,
                                _l)])]);
                    components.forEach(function (leg, i) {
                        if (!leg.account) {
                            return;
                        }
                        // create temporary account for wrapped sol to perform transfer
                        var from = getWrappedAccount(instructions, cleanupInstructions, leg.account, wallet.publicKey, leg.amount + accountRentExempt, signers);
                        instructions.push(Token.createTransferInstruction(programIds().token, from, holdingAccounts[i].publicKey, wallet.publicKey, [], leg.amount));
                    });
                    instructions.push(createInitSwapInstruction(tokenSwapAccount, authority, holdingAccounts[0].publicKey, holdingAccounts[1].publicKey, liquidityTokenMint.publicKey, feeAccount.publicKey, depositorAccount.publicKey, programIds().token, programIds().swap, nonce, options));
                    return [4 /*yield*/, sendTransaction(connection, wallet, instructions.concat(cleanupInstructions), __spread([tokenSwapAccount], signers))];
                case 6:
                    // All instructions didn't fit in single transaction
                    // initialize and provide inital liquidity to swap in 2nd (this prevents loss of funds)
                    tx = _m.sent();
                    console.log({
                        message: "Pool Funded. Happy trading.",
                        type: "success",
                        description: "Transaction - " + tx,
                    });
                    return [2 /*return*/];
            }
        });
    });
}
function approveAmount(instructions, cleanupInstructions, account, delegate, owner, amount) {
    var tokenProgram = programIds().token;
    instructions.push(Token.createApproveInstruction(tokenProgram, account, delegate, owner, [], amount));
    cleanupInstructions.push(Token.createRevokeInstruction(tokenProgram, account, owner, []));
}
function getWrappedAccount(instructions, cleanupInstructions, toCheck, payer, amount, signers) {
    if (!toCheck.info.isNative) {
        return toCheck.pubkey;
    }
    var account = new Account();
    instructions.push(SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: account.publicKey,
        lamports: amount,
        space: AccountLayout.span,
        programId: programIds().token,
    }));
    instructions.push(Token.createInitAccountInstruction(programIds().token, WRAPPED_SOL_MINT, account.publicKey, payer));
    cleanupInstructions.push(Token.createCloseAccountInstruction(programIds().token, account.publicKey, payer, payer, []));
    signers.push(account);
    return account.publicKey;
}
function createSplAccount(instructions, payer, accountRentExempt, mint, owner, space) {
    var account = new Account();
    instructions.push(SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: account.publicKey,
        lamports: accountRentExempt,
        space: space,
        programId: programIds().token,
    }));
    instructions.push(Token.createInitAccountInstruction(programIds().token, mint, account.publicKey, owner));
    return account;
}
