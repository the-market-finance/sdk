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
exports.liquidateInstruction = void 0;
var web3_js_1 = require('@solana/web3.js');
var bn_js_1 = __importDefault(require('bn.js'));
var ids_1 = require('../../constants/ids');
var lending_1 = require('./lending');
var BufferLayout = __importStar(require('buffer-layout'));
var Layout = __importStar(require('./../../utils/layout'));
/// Purchase collateral tokens at a discount rate if the chosen obligation is unhealthy.
///
///   0. `[writable]` Liquidity input SPL Token account, $authority can transfer $liquidity_amount
///   1. `[writable]` Collateral output SPL Token account
///   2. `[writable]` Repay reserve account.
///   3. `[writable]` Repay reserve liquidity supply SPL Token account
///   4. `[writable]` Withdraw reserve account.
///   5. `[writable]` Withdraw reserve collateral supply SPL Token account
///   6. `[writable]` Obligation - initialized
///   7. `[]` Derived lending market authority ($authority).
///   8. `[]` Dex market
///   9. `[]` Dex market orders
///   10 `[]` Temporary memory
///   11 `[]` Clock sysvar
///   12 `[]` Token program id
var liquidateInstruction = function (
  liquidityAmount,
  from, // Liquidity input SPL Token account. $authority can transfer $liquidity_amount
  to, // Collateral output SPL Token account,
  repayReserveAccount,
  repayReserveLiquiditySupply,
  withdrawReserve,
  withdrawReserveCollateralSupply,
  obligation,
  authority,
  dexMarket,
  dexOrderBookSide,
  memory,
) {
  var dataLayout = BufferLayout.struct([BufferLayout.u8('instruction'), Layout.uint64('liquidityAmount')]);
  var data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: lending_1.LendingInstruction.LiquidateObligation,
      liquidityAmount: new bn_js_1.default(liquidityAmount),
    },
    data,
  );
  var keys = [
    { pubkey: from, isSigner: false, isWritable: true },
    { pubkey: to, isSigner: false, isWritable: true },
    { pubkey: repayReserveAccount, isSigner: false, isWritable: true },
    { pubkey: repayReserveLiquiditySupply, isSigner: false, isWritable: true },
    { pubkey: withdrawReserve, isSigner: false, isWritable: true },
    {
      pubkey: withdrawReserveCollateralSupply,
      isSigner: false,
      isWritable: true,
    },
    { pubkey: obligation, isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: dexMarket, isSigner: false, isWritable: false },
    { pubkey: dexOrderBookSide, isSigner: false, isWritable: false },
    { pubkey: memory, isSigner: false, isWritable: false },
    { pubkey: web3_js_1.SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: ids_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];
  return new web3_js_1.TransactionInstruction({
    keys: keys,
    programId: ids_1.LENDING_PROGRAM_ID,
    data: data,
  });
};
exports.liquidateInstruction = liquidateInstruction;
