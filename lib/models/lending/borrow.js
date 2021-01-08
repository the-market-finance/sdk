import { SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, TransactionInstruction, } from "@solana/web3.js";
import BN from "bn.js";
import * as BufferLayout from "buffer-layout";
import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID } from "../../constants";
import { wadToLamports } from "../../utils/utils";
import * as Layout from "./../../utils/layout";
import { LendingInstruction } from "./lending";
export var BorrowAmountType;
(function (BorrowAmountType) {
    BorrowAmountType[BorrowAmountType["LiquidityBorrowAmount"] = 0] = "LiquidityBorrowAmount";
    BorrowAmountType[BorrowAmountType["CollateralDepositAmount"] = 1] = "CollateralDepositAmount";
})(BorrowAmountType || (BorrowAmountType = {}));
/// Borrow tokens from a reserve by depositing collateral tokens. The number of borrowed tokens
/// is calculated by market price. The debt obligation is tokenized.
///
///   0. `[writable]` Collateral input SPL Token account, $authority can transfer $collateral_amount
///   1. `[writable]` Liquidity output SPL Token account
///   2. `[writable]` Deposit reserve account.
///   3. `[writable]` Deposit reserve collateral supply SPL Token account
///   4. `[writable]` Borrow reserve account.
///   5. `[writable]` Borrow reserve liquidity supply SPL Token account
///   6. `[writable]` Obligation - uninitialized
///   7. `[writable]` Obligation token mint - uninitialized
///   8. `[writable]` Obligation token output - uninitialized
///   9. `[]` Obligation token owner
///   10 `[]` Derived lending market authority ($authority).
///   11 `[]` Dex market
///   12 `[]` Dex order book side // could be bid/ask
///   13 `[]` Temporary memory
///   14 `[]` Clock sysvar
///   15 `[]` Rent sysvar
///   16 '[]` Token program id
export var borrowInstruction = function (amount, amountType, from, // Collateral input SPL Token account. $authority can transfer $collateralAmount
to, // Liquidity output SPL Token account,
depositReserve, depositReserveCollateralSupply, borrowReserve, borrowReserveLiquiditySupply, obligation, obligationMint, obligationTokenOutput, obligationTokenOwner, lendingMarketAuthority, dexMarket, dexOrderBookSide, memory) {
    var dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        Layout.uint64("amount"),
        BufferLayout.u8("amountType"),
    ]);
    var data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: LendingInstruction.BorrowLiquidity,
        amount: new BN(amount),
        amountType: amountType,
    }, data);
    var keys = [
        { pubkey: from, isSigner: false, isWritable: true },
        { pubkey: to, isSigner: false, isWritable: true },
        { pubkey: depositReserve, isSigner: false, isWritable: true },
        {
            pubkey: depositReserveCollateralSupply,
            isSigner: false,
            isWritable: true,
        },
        { pubkey: borrowReserve, isSigner: false, isWritable: true },
        {
            pubkey: borrowReserveLiquiditySupply,
            isSigner: false,
            isWritable: true,
        },
        { pubkey: obligation, isSigner: false, isWritable: true },
        { pubkey: obligationMint, isSigner: false, isWritable: true },
        { pubkey: obligationTokenOutput, isSigner: false, isWritable: true },
        { pubkey: obligationTokenOwner, isSigner: false, isWritable: false },
        { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
        { pubkey: dexMarket, isSigner: false, isWritable: false },
        { pubkey: dexOrderBookSide, isSigner: false, isWritable: false },
        { pubkey: memory, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
    return new TransactionInstruction({
        keys: keys,
        programId: LENDING_PROGRAM_ID,
        data: data,
    });
};
// deposit APY utilization currentUtilizationRate * borrowAPY
export var calculateBorrowAPY = function (reserve) {
    var totalBorrows = wadToLamports(reserve.borrowedLiquidityWad).toNumber();
    var currentUtilization = totalBorrows / (reserve.availableLiquidity.toNumber() + totalBorrows);
    var optimalUtilization = reserve.config.optimalUtilizationRate / 100;
    var borrowAPY;
    if (optimalUtilization === 1.0 || currentUtilization < optimalUtilization) {
        var normalizedFactor = currentUtilization / optimalUtilization;
        var optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
        var minBorrowRate = reserve.config.minBorrowRate / 100;
        borrowAPY =
            normalizedFactor * (optimalBorrowRate - minBorrowRate) + minBorrowRate;
    }
    else {
        var normalizedFactor = (currentUtilization - optimalUtilization) / (1 - optimalUtilization);
        var optimalBorrowRate = reserve.config.optimalBorrowRate / 100;
        var maxBorrowRate = reserve.config.maxBorrowRate / 100;
        borrowAPY =
            normalizedFactor * (maxBorrowRate - optimalBorrowRate) +
                optimalBorrowRate;
    }
    return borrowAPY;
};
