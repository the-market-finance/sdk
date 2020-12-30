'use strict';
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
exports.calculateDepositAPY = exports.depositInstruction = void 0;
var web3_js_1 = require('@solana/web3.js');
var bn_js_1 = __importDefault(require('bn.js'));
var BufferLayout = __importStar(require('buffer-layout'));
var ids_1 = require('../../constants/ids');
var utils_1 = require('../../utils/utils');
var Layout = __importStar(require('./../../utils/layout'));
var borrow_1 = require('./borrow');
var lending_1 = require('./lending');
/// Deposit liquidity into a reserve. The output is a collateral token representing ownership
/// of the reserve liquidity pool.
///
///   0. `[writable]` Liquidity input SPL Token account. $authority can transfer $liquidity_amount
///   1. `[writable]` Collateral output SPL Token account,
///   2. `[writable]` Reserve account.
///   3. `[writable]` Reserve liquidity supply SPL Token account.
///   4. `[writable]` Reserve collateral SPL Token mint.
///   5. `[]` Derived lending market authority ($authority).
///   6. `[]` Clock sysvar
///   7. '[]` Token program id
var depositInstruction = function (
  liquidityAmount,
  from, // Liquidity input SPL Token account. $authority can transfer $liquidity_amount
  to, // Collateral output SPL Token account,
  reserveAuthority,
  reserveAccount,
  reserveSupply,
  collateralMint,
) {
  var dataLayout = BufferLayout.struct([BufferLayout.u8('instruction'), Layout.uint64('liquidityAmount')]);
  var data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: lending_1.LendingInstruction.DepositReserveLiquidity,
      liquidityAmount: new bn_js_1.default(liquidityAmount),
    },
    data,
  );
  var keys = [
    { pubkey: from, isSigner: false, isWritable: true },
    { pubkey: to, isSigner: false, isWritable: true },
    { pubkey: reserveAccount, isSigner: false, isWritable: true },
    { pubkey: reserveSupply, isSigner: false, isWritable: true },
    { pubkey: collateralMint, isSigner: false, isWritable: true },
    { pubkey: reserveAuthority, isSigner: false, isWritable: false },
    { pubkey: web3_js_1.SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: ids_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];
  return new web3_js_1.TransactionInstruction({
    keys: keys,
    programId: ids_1.LENDING_PROGRAM_ID,
    data: data,
  });
};
exports.depositInstruction = depositInstruction;
var calculateDepositAPY = function (reserve) {
  var totalBorrows = utils_1.wadToLamports(reserve.borrowedLiquidityWad).toNumber();
  var currentUtilization = totalBorrows / (reserve.availableLiquidity.toNumber() + totalBorrows);
  var borrowAPY = borrow_1.calculateBorrowAPY(reserve);
  return currentUtilization * borrowAPY;
};
exports.calculateDepositAPY = calculateDepositAPY;
