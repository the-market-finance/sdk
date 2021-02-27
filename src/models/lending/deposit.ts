import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import * as BufferLayout from "buffer-layout";
import { TOKEN_PROGRAM_ID } from "../../constants";
import { wadToLamports } from "../../utils/utils";
import * as Layout from "./../../utils/layout";
import { calculateBorrowAPY } from "./borrow";
import { LendingInstruction } from "./lending";
import { LendingReserve } from "./reserve";

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
export const depositInstruction = (
  liquidityAmount: number | BN,
  from: PublicKey, // Liquidity input SPL Token account. $authority can transfer $liquidity_amount
  to: PublicKey, // Collateral output SPL Token account,
  reserveAuthority: PublicKey,
  reserveAccount: PublicKey,
  reserveSupply: PublicKey,
  collateralMint: PublicKey,
  programId: PublicKey, // (lending program id)
  ourMintDepositAccount?: PublicKey,
  ourMintLiquiditySupply?: PublicKey,
  marketAuthority?: PublicKey,
  marketAddress?: PublicKey,
  dexMarket?: PublicKey,
  dexOrderBookSide?: PublicKey,
  memory?: PublicKey,
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Layout.uint64("liquidityAmount"),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.DepositReserveLiquidity,
      liquidityAmount: new BN(liquidityAmount),
    },
    data
  );

  const keys = [
    { pubkey: from, isSigner: false, isWritable: true },
    { pubkey: to, isSigner: false, isWritable: true },
    { pubkey: reserveAccount, isSigner: false, isWritable: true },
    { pubkey: reserveSupply, isSigner: false, isWritable: true },
    { pubkey: collateralMint, isSigner: false, isWritable: true },
    { pubkey: reserveAuthority, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];
  // transfer our mints
  if (ourMintDepositAccount && ourMintLiquiditySupply && marketAddress && marketAuthority) {
    keys.push(
        {pubkey: ourMintLiquiditySupply, isSigner: false, isWritable: true},
        {pubkey: ourMintDepositAccount, isSigner: false, isWritable: true},
        {pubkey: marketAuthority, isSigner: false, isWritable: false},
        {pubkey: marketAddress, isSigner: false, isWritable: false},
        // + 3 param
        {pubkey: dexMarket!, isSigner: false, isWritable: false},
        {pubkey: dexOrderBookSide!, isSigner: false, isWritable: false},
        {pubkey: memory!, isSigner: false, isWritable: false},

    )
  }

  return new TransactionInstruction({
    keys,
    programId: programId,
    data,
  });
};

export const calculateDepositAPY = (reserve: LendingReserve) => {
  const totalBorrows = wadToLamports(reserve.borrowedLiquidityWad).toNumber();
  const currentUtilization =
    totalBorrows / (reserve.availableLiquidity.toNumber() + totalBorrows);

  const borrowAPY = calculateBorrowAPY(reserve);
  return currentUtilization * borrowAPY;
};
