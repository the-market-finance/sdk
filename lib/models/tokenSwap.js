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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { Numberu64 } from "@solana/spl-token-swap";
import { TransactionInstruction } from "@solana/web3.js";
import * as BufferLayout from "buffer-layout";
import { CurveType } from "./pool";
import { programIds } from "../constants";
export { TokenSwap } from "@solana/spl-token-swap";
/**
 * Layout for a public key
 */
export var publicKey = function (property) {
    if (property === void 0) { property = "publicKey"; }
    return BufferLayout.blob(32, property);
};
/**
 * Layout for a 64bit unsigned value
 */
export var uint64 = function (property) {
    if (property === void 0) { property = "uint64"; }
    return BufferLayout.blob(8, property);
};
var FEE_LAYOUT = BufferLayout.struct([
    BufferLayout.nu64("tradeFeeNumerator"),
    BufferLayout.nu64("tradeFeeDenominator"),
    BufferLayout.nu64("ownerTradeFeeNumerator"),
    BufferLayout.nu64("ownerTradeFeeDenominator"),
    BufferLayout.nu64("ownerWithdrawFeeNumerator"),
    BufferLayout.nu64("ownerWithdrawFeeDenominator"),
    BufferLayout.nu64("hostFeeNumerator"),
    BufferLayout.nu64("hostFeeDenominator"),
], "fees");
export var TokenSwapLayoutLegacyV0 = BufferLayout.struct([
    BufferLayout.u8("isInitialized"),
    BufferLayout.u8("nonce"),
    publicKey("tokenAccountA"),
    publicKey("tokenAccountB"),
    publicKey("tokenPool"),
    uint64("feesNumerator"),
    uint64("feesDenominator"),
]);
export var TokenSwapLayoutV1 = BufferLayout.struct([
    BufferLayout.u8("isInitialized"),
    BufferLayout.u8("nonce"),
    publicKey("tokenProgramId"),
    publicKey("tokenAccountA"),
    publicKey("tokenAccountB"),
    publicKey("tokenPool"),
    publicKey("mintA"),
    publicKey("mintB"),
    publicKey("feeAccount"),
    BufferLayout.u8("curveType"),
    uint64("tradeFeeNumerator"),
    uint64("tradeFeeDenominator"),
    uint64("ownerTradeFeeNumerator"),
    uint64("ownerTradeFeeDenominator"),
    uint64("ownerWithdrawFeeNumerator"),
    uint64("ownerWithdrawFeeDenominator"),
    BufferLayout.blob(16, "padding"),
]);
var CURVE_NODE = BufferLayout.union(BufferLayout.u8(), BufferLayout.blob(32), "curve");
CURVE_NODE.addVariant(0, BufferLayout.struct([]), "constantProduct");
CURVE_NODE.addVariant(1, BufferLayout.struct([BufferLayout.nu64("token_b_price")]), "constantPrice");
CURVE_NODE.addVariant(2, BufferLayout.struct([]), "stable");
CURVE_NODE.addVariant(3, BufferLayout.struct([BufferLayout.nu64("token_b_offset")]), "offset");
export var TokenSwapLayout = BufferLayout.struct([
    BufferLayout.u8('version'),
    BufferLayout.u8("isInitialized"),
    BufferLayout.u8("nonce"),
    publicKey("tokenProgramId"),
    publicKey("tokenAccountA"),
    publicKey("tokenAccountB"),
    publicKey("tokenPool"),
    publicKey("mintA"),
    publicKey("mintB"),
    publicKey("feeAccount"),
    FEE_LAYOUT,
    CURVE_NODE,
]);
export var createInitSwapInstruction = function (tokenSwapAccount, authority, tokenAccountA, tokenAccountB, tokenPool, feeAccount, destinationAccount, tokenProgramId, swapProgramId, nonce, config) {
    var keys = [
        { pubkey: tokenSwapAccount.publicKey, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: false, isWritable: false },
        { pubkey: tokenAccountA, isSigner: false, isWritable: false },
        { pubkey: tokenAccountB, isSigner: false, isWritable: false },
        { pubkey: tokenPool, isSigner: false, isWritable: true },
        { pubkey: feeAccount, isSigner: false, isWritable: false },
        { pubkey: destinationAccount, isSigner: false, isWritable: true },
        { pubkey: tokenProgramId, isSigner: false, isWritable: false },
    ];
    var data = Buffer.alloc(1024);
    {
        var isLatestLayout = programIds().swapLayout === TokenSwapLayout;
        if (isLatestLayout) {
            var fields = [
                BufferLayout.u8("instruction"),
                BufferLayout.u8("nonce"),
                BufferLayout.nu64("tradeFeeNumerator"),
                BufferLayout.nu64("tradeFeeDenominator"),
                BufferLayout.nu64("ownerTradeFeeNumerator"),
                BufferLayout.nu64("ownerTradeFeeDenominator"),
                BufferLayout.nu64("ownerWithdrawFeeNumerator"),
                BufferLayout.nu64("ownerWithdrawFeeDenominator"),
                BufferLayout.nu64("hostFeeNumerator"),
                BufferLayout.nu64("hostFeeDenominator"),
                BufferLayout.u8("curveType"),
            ];
            if (config.curveType === CurveType.ConstantProductWithOffset) {
                fields.push(BufferLayout.nu64("token_b_offset"));
                fields.push(BufferLayout.blob(24, "padding"));
            }
            else if (config.curveType === CurveType.ConstantPrice) {
                fields.push(BufferLayout.nu64("token_b_price"));
                fields.push(BufferLayout.blob(24, "padding"));
            }
            else {
                fields.push(BufferLayout.blob(32, "padding"));
            }
            var commandDataLayout = BufferLayout.struct(fields);
            var fees = config.fees, rest = __rest(config, ["fees"]);
            var encodeLength = commandDataLayout.encode(__assign(__assign({ instruction: 0, // InitializeSwap instruction
                nonce: nonce }, fees), rest), data);
            data = data.slice(0, encodeLength);
        }
        else {
            var commandDataLayout = BufferLayout.struct([
                BufferLayout.u8("instruction"),
                BufferLayout.u8("nonce"),
                BufferLayout.u8("curveType"),
                BufferLayout.nu64("tradeFeeNumerator"),
                BufferLayout.nu64("tradeFeeDenominator"),
                BufferLayout.nu64("ownerTradeFeeNumerator"),
                BufferLayout.nu64("ownerTradeFeeDenominator"),
                BufferLayout.nu64("ownerWithdrawFeeNumerator"),
                BufferLayout.nu64("ownerWithdrawFeeDenominator"),
                BufferLayout.blob(16, "padding"),
            ]);
            var encodeLength = commandDataLayout.encode({
                instruction: 0,
                nonce: nonce,
                curveType: config.curveType,
                tradeFeeNumerator: config.fees.tradeFeeNumerator,
                tradeFeeDenominator: config.fees.tradeFeeDenominator,
                ownerTradeFeeNumerator: config.fees.ownerTradeFeeNumerator,
                ownerTradeFeeDenominator: config.fees.ownerTradeFeeDenominator,
                ownerWithdrawFeeNumerator: config.fees.ownerWithdrawFeeNumerator,
                ownerWithdrawFeeDenominator: config.fees.ownerWithdrawFeeDenominator,
            }, data);
            data = data.slice(0, encodeLength);
        }
    }
    return new TransactionInstruction({
        keys: keys,
        programId: swapProgramId,
        data: data,
    });
};
export var depositInstruction = function (tokenSwap, authority, sourceA, sourceB, intoA, intoB, poolToken, poolAccount, swapProgramId, tokenProgramId, poolTokenAmount, maximumTokenA, maximumTokenB) {
    var dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        uint64("poolTokenAmount"),
        uint64("maximumTokenA"),
        uint64("maximumTokenB"),
    ]);
    var data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: 2,
        poolTokenAmount: new Numberu64(poolTokenAmount).toBuffer(),
        maximumTokenA: new Numberu64(maximumTokenA).toBuffer(),
        maximumTokenB: new Numberu64(maximumTokenB).toBuffer(),
    }, data);
    var keys = [
        { pubkey: tokenSwap, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: false, isWritable: false },
        { pubkey: sourceA, isSigner: false, isWritable: true },
        { pubkey: sourceB, isSigner: false, isWritable: true },
        { pubkey: intoA, isSigner: false, isWritable: true },
        { pubkey: intoB, isSigner: false, isWritable: true },
        { pubkey: poolToken, isSigner: false, isWritable: true },
        { pubkey: poolAccount, isSigner: false, isWritable: true },
        { pubkey: tokenProgramId, isSigner: false, isWritable: false },
    ];
    return new TransactionInstruction({
        keys: keys,
        programId: swapProgramId,
        data: data,
    });
};
export var depositExactOneInstruction = function (tokenSwap, authority, source, intoA, intoB, poolToken, poolAccount, swapProgramId, tokenProgramId, sourceTokenAmount, minimumPoolTokenAmount) {
    var dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        uint64("sourceTokenAmount"),
        uint64("minimumPoolTokenAmount"),
    ]);
    var data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: 4,
        sourceTokenAmount: new Numberu64(sourceTokenAmount).toBuffer(),
        minimumPoolTokenAmount: new Numberu64(minimumPoolTokenAmount).toBuffer(),
    }, data);
    var keys = [
        { pubkey: tokenSwap, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: false, isWritable: false },
        { pubkey: source, isSigner: false, isWritable: true },
        { pubkey: intoA, isSigner: false, isWritable: true },
        { pubkey: intoB, isSigner: false, isWritable: true },
        { pubkey: poolToken, isSigner: false, isWritable: true },
        { pubkey: poolAccount, isSigner: false, isWritable: true },
        { pubkey: tokenProgramId, isSigner: false, isWritable: false },
    ];
    return new TransactionInstruction({
        keys: keys,
        programId: swapProgramId,
        data: data,
    });
};
export var withdrawInstruction = function (tokenSwap, authority, poolMint, feeAccount, sourcePoolAccount, fromA, fromB, userAccountA, userAccountB, swapProgramId, tokenProgramId, poolTokenAmount, minimumTokenA, minimumTokenB) {
    var dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        uint64("poolTokenAmount"),
        uint64("minimumTokenA"),
        uint64("minimumTokenB"),
    ]);
    var data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: 3,
        poolTokenAmount: new Numberu64(poolTokenAmount).toBuffer(),
        minimumTokenA: new Numberu64(minimumTokenA).toBuffer(),
        minimumTokenB: new Numberu64(minimumTokenB).toBuffer(),
    }, data);
    var keys = [
        { pubkey: tokenSwap, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: false, isWritable: false },
        { pubkey: poolMint, isSigner: false, isWritable: true },
        { pubkey: sourcePoolAccount, isSigner: false, isWritable: true },
        { pubkey: fromA, isSigner: false, isWritable: true },
        { pubkey: fromB, isSigner: false, isWritable: true },
        { pubkey: userAccountA, isSigner: false, isWritable: true },
        { pubkey: userAccountB, isSigner: false, isWritable: true },
    ];
    if (feeAccount) {
        keys.push({ pubkey: feeAccount, isSigner: false, isWritable: true });
    }
    keys.push({ pubkey: tokenProgramId, isSigner: false, isWritable: false });
    return new TransactionInstruction({
        keys: keys,
        programId: swapProgramId,
        data: data,
    });
};
export var withdrawExactOneInstruction = function (tokenSwap, authority, poolMint, sourcePoolAccount, fromA, fromB, userAccount, feeAccount, swapProgramId, tokenProgramId, sourceTokenAmount, maximumTokenAmount) {
    var dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        uint64("sourceTokenAmount"),
        uint64("maximumTokenAmount"),
    ]);
    var data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: 5,
        sourceTokenAmount: new Numberu64(sourceTokenAmount).toBuffer(),
        maximumTokenAmount: new Numberu64(maximumTokenAmount).toBuffer(),
    }, data);
    var keys = [
        { pubkey: tokenSwap, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: false, isWritable: false },
        { pubkey: poolMint, isSigner: false, isWritable: true },
        { pubkey: sourcePoolAccount, isSigner: false, isWritable: true },
        { pubkey: fromA, isSigner: false, isWritable: true },
        { pubkey: fromB, isSigner: false, isWritable: true },
        { pubkey: userAccount, isSigner: false, isWritable: true },
    ];
    if (feeAccount) {
        keys.push({ pubkey: feeAccount, isSigner: false, isWritable: true });
    }
    keys.push({ pubkey: tokenProgramId, isSigner: false, isWritable: false });
    return new TransactionInstruction({
        keys: keys,
        programId: swapProgramId,
        data: data,
    });
};
export var swapInstruction = function (tokenSwap, authority, userSource, poolSource, poolDestination, userDestination, poolMint, feeAccount, swapProgramId, tokenProgramId, amountIn, minimumAmountOut, programOwner) {
    var dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        uint64("amountIn"),
        uint64("minimumAmountOut"),
    ]);
    var keys = [
        { pubkey: tokenSwap, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: false, isWritable: false },
        { pubkey: userSource, isSigner: false, isWritable: true },
        { pubkey: poolSource, isSigner: false, isWritable: true },
        { pubkey: poolDestination, isSigner: false, isWritable: true },
        { pubkey: userDestination, isSigner: false, isWritable: true },
        { pubkey: poolMint, isSigner: false, isWritable: true },
        { pubkey: feeAccount, isSigner: false, isWritable: true },
        { pubkey: tokenProgramId, isSigner: false, isWritable: false },
    ];
    // optional depending on the build of token-swap program
    if (programOwner) {
        keys.push({ pubkey: programOwner, isSigner: false, isWritable: true });
    }
    var data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: 1,
        amountIn: new Numberu64(amountIn).toBuffer(),
        minimumAmountOut: new Numberu64(minimumAmountOut).toBuffer(),
    }, data);
    return new TransactionInstruction({
        keys: keys,
        programId: swapProgramId,
        data: data,
    });
};
