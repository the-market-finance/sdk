import { SYSVAR_CLOCK_PUBKEY, TransactionInstruction, } from "@solana/web3.js";
import BN from "bn.js";
import * as BufferLayout from "buffer-layout";
import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID } from "../../constants";
import { wadToLamports } from "../../utils/utils";
import * as Layout from "./../../utils/layout";
import { calculateBorrowAPY } from "./borrow";
import { LendingInstruction } from "./lending";
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
export var depositInstruction = function (liquidityAmount, from, // Liquidity input SPL Token account. $authority can transfer $liquidity_amount
to, // Collateral output SPL Token account,
reserveAuthority, reserveAccount, reserveSupply, collateralMint) {
    var dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        Layout.uint64("liquidityAmount"),
    ]);
    var data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: LendingInstruction.DepositReserveLiquidity,
        liquidityAmount: new BN(liquidityAmount),
    }, data);
    var keys = [
        { pubkey: from, isSigner: false, isWritable: true },
        { pubkey: to, isSigner: false, isWritable: true },
        { pubkey: reserveAccount, isSigner: false, isWritable: true },
        { pubkey: reserveSupply, isSigner: false, isWritable: true },
        { pubkey: collateralMint, isSigner: false, isWritable: true },
        { pubkey: reserveAuthority, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
    return new TransactionInstruction({
        keys: keys,
        programId: LENDING_PROGRAM_ID,
        data: data,
    });
};
export var calculateDepositAPY = function (reserve) {
    var totalBorrows = wadToLamports(reserve.borrowedLiquidityWad).toNumber();
    var currentUtilization = totalBorrows / (reserve.availableLiquidity.toNumber() + totalBorrows);
    var borrowAPY = calculateBorrowAPY(reserve);
    return currentUtilization * borrowAPY;
};
