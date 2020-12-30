'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.LendingInstruction = void 0;
var LendingInstruction;
(function (LendingInstruction) {
  LendingInstruction[(LendingInstruction['InitLendingMarket'] = 0)] = 'InitLendingMarket';
  LendingInstruction[(LendingInstruction['InitReserve'] = 1)] = 'InitReserve';
  LendingInstruction[(LendingInstruction['DepositReserveLiquidity'] = 2)] = 'DepositReserveLiquidity';
  LendingInstruction[(LendingInstruction['WithdrawReserveLiquidity'] = 3)] = 'WithdrawReserveLiquidity';
  LendingInstruction[(LendingInstruction['BorrowLiquidity'] = 4)] = 'BorrowLiquidity';
  LendingInstruction[(LendingInstruction['RepayOblogationLiquidity'] = 5)] = 'RepayOblogationLiquidity';
  LendingInstruction[(LendingInstruction['LiquidateObligation'] = 6)] = 'LiquidateObligation';
})((LendingInstruction = exports.LendingInstruction || (exports.LendingInstruction = {})));
