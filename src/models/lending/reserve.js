'use strict';
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, {
          enumerable: true,
          get: function () {
            return m[k];
          },
        });
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.liquidityToCollateral = exports.collateralToLiquidity = exports.collateralExchangeRate = exports.reserveMarketCap = exports.calculateUtilizationRatio = exports.initReserveInstruction = exports.LendingReserveParser = exports.isLendingReserve = exports.LendingReserveLayout = void 0;
var web3_js_1 = require('@solana/web3.js');
var bn_js_1 = __importDefault(require('bn.js'));
var BufferLayout = __importStar(require('buffer-layout'));
var ids_1 = require('../../constants/ids');
var utils_1 = require('../../utils/utils');
var Layout = __importStar(require('./../../utils/layout'));
var lending_1 = require('./lending');
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
  BufferLayout.struct(
    [
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
    ],
    'config',
  ),
  Layout.uint128('cumulativeBorrowRateWad'),
  Layout.uint128('borrowedLiquidityWad'),
  Layout.uint64('availableLiquidity'),
  Layout.uint64('collateralMintSupply'),
]);
var isLendingReserve = function (info) {
  return info.data.length === exports.LendingReserveLayout.span;
};
exports.isLendingReserve = isLendingReserve;
var LendingReserveParser = function (pubKey, info) {
  var buffer = Buffer.from(info.data);
  var data = exports.LendingReserveLayout.decode(buffer);
  if (data.lastUpdateSlot.toNumber() === 0) return;
  var details = {
    pubkey: pubKey,
    account: __assign({}, info),
    info: data,
  };
  return details;
};
exports.LendingReserveParser = LendingReserveParser;
var initReserveInstruction = function (
  liquidityAmount,
  maxUtilizationRate,
  from, // Liquidity input SPL Token account. $authority can transfer $liquidity_amount
  to, // Collateral output SPL Token account,
  reserveAccount,
  liquidityMint,
  liquiditySupply,
  collateralMint,
  collateralSupply,
  lendingMarket,
  lendingMarketAuthority,
  dexMarket,
) {
  var dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    Layout.uint64('liquidityAmount'),
    BufferLayout.u8('maxUtilizationRate'),
  ]);
  var data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: lending_1.LendingInstruction.InitReserve,
      liquidityAmount: new bn_js_1.default(liquidityAmount),
      maxUtilizationRate: maxUtilizationRate,
    },
    data,
  );
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
    { pubkey: web3_js_1.SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: ids_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    // optionals
    { pubkey: dexMarket, isSigner: false, isWritable: false },
  ];
  return new web3_js_1.TransactionInstruction({
    keys: keys,
    programId: ids_1.LENDING_PROGRAM_ID,
    data: data,
  });
};
exports.initReserveInstruction = initReserveInstruction;
var calculateUtilizationRatio = function (reserve) {
  var borrowedLiquidity = utils_1.wadToLamports(reserve.borrowedLiquidityWad).toNumber();
  return borrowedLiquidity / (reserve.availableLiquidity.toNumber() + borrowedLiquidity);
};
exports.calculateUtilizationRatio = calculateUtilizationRatio;
var reserveMarketCap = function (reserve) {
  var available = (reserve === null || reserve === void 0 ? void 0 : reserve.availableLiquidity.toNumber()) || 0;
  var borrowed = utils_1
    .wadToLamports(reserve === null || reserve === void 0 ? void 0 : reserve.borrowedLiquidityWad)
    .toNumber();
  var total = available + borrowed;
  return total;
};
exports.reserveMarketCap = reserveMarketCap;
var collateralExchangeRate = function (reserve) {
  return (
    ((reserve === null || reserve === void 0 ? void 0 : reserve.collateralMintSupply.toNumber()) || 1) /
    exports.reserveMarketCap(reserve)
  );
};
exports.collateralExchangeRate = collateralExchangeRate;
var collateralToLiquidity = function (collateralAmount, reserve) {
  var amount = typeof collateralAmount === 'number' ? collateralAmount : collateralAmount.toNumber();
  return Math.floor(amount / exports.collateralExchangeRate(reserve));
};
exports.collateralToLiquidity = collateralToLiquidity;
var liquidityToCollateral = function (liquidityAmount, reserve) {
  var amount = typeof liquidityAmount === 'number' ? liquidityAmount : liquidityAmount.toNumber();
  return Math.floor(amount * exports.collateralExchangeRate(reserve));
};
exports.liquidityToCollateral = liquidityToCollateral;
