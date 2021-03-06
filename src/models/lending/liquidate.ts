import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import {TOKEN_PROGRAM_ID } from "../../constants/ids";
import { LendingInstruction } from "./lending";
import * as BufferLayout from "buffer-layout";
import * as Layout from "./../../utils/layout";

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
export const liquidateInstruction = (
  liquidityAmount: number | BN,
  from: PublicKey, // Liquidity input SPL Token account. $authority can transfer $liquidity_amount
  to: PublicKey, // Collateral output SPL Token account,
  repayReserveAccount: PublicKey,
  repayReserveLiquiditySupply: PublicKey,
  withdrawReserve: PublicKey,
  withdrawReserveCollateralSupply: PublicKey,
  obligation: PublicKey,
  authority: PublicKey,
  dexMarket: PublicKey,
  dexOrderBookSide: PublicKey,
  memory: PublicKey,
  programId: PublicKey
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Layout.uint64("liquidityAmount"),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.LiquidateObligation,
      liquidityAmount: new BN(liquidityAmount),
    },
    data
  );

  const keys = [
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

    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: programId,
    data,
  });
};
