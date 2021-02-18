import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import * as BufferLayout from "buffer-layout";
import { TOKEN_PROGRAM_ID } from "../../constants";
import * as Layout from "./../../utils/layout";
import { LendingInstruction } from "./lending";

export const withdrawInstruction = (
  collateralAmount: number | BN,
  from: PublicKey, // Collateral input SPL Token account. $authority can transfer $liquidity_amount
  to: PublicKey, // Liquidity output SPL Token account,
  reserveAccount: PublicKey,
  collateralMint: PublicKey,
  reserveSupply: PublicKey,
  authority: PublicKey,
  programId: PublicKey,
  ourMintDepositAccount?: PublicKey,
  ourMintLiquiditySupply?: PublicKey,
  marketAuthority?:PublicKey,
  marketAddress?:PublicKey,
  dexMarket?: PublicKey,
  dexOrderBookSide?: PublicKey,
  memory?: PublicKey,
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Layout.uint64("collateralAmount"),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.WithdrawReserveLiquidity,
      collateralAmount: new BN(collateralAmount),
    },
    data
  );

  const keys = [
    { pubkey: from, isSigner: false, isWritable: true },
    { pubkey: to, isSigner: false, isWritable: true },
    { pubkey: reserveAccount, isSigner: false, isWritable: true },
    { pubkey: collateralMint, isSigner: false, isWritable: true },
    { pubkey: reserveSupply, isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: false, isWritable: false },
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
        // + 3 param for withdraw and repay
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
