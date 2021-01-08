import { SYSVAR_CLOCK_PUBKEY, TransactionInstruction, } from "@solana/web3.js";
import BN from "bn.js";
import * as BufferLayout from "buffer-layout";
import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID } from "../../constants/ids";
import * as Layout from "./../../utils/layout";
import { LendingInstruction } from "./lending";
export var withdrawInstruction = function (collateralAmount, from, // Collateral input SPL Token account. $authority can transfer $liquidity_amount
to, // Liquidity output SPL Token account,
reserveAccount, collateralMint, reserveSupply, authority) {
    var dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        Layout.uint64("collateralAmount"),
    ]);
    var data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: LendingInstruction.WithdrawReserveLiquidity,
        collateralAmount: new BN(collateralAmount),
    }, data);
    var keys = [
        { pubkey: from, isSigner: false, isWritable: true },
        { pubkey: to, isSigner: false, isWritable: true },
        { pubkey: reserveAccount, isSigner: false, isWritable: true },
        { pubkey: collateralMint, isSigner: false, isWritable: true },
        { pubkey: reserveSupply, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
    return new TransactionInstruction({
        keys: keys,
        programId: LENDING_PROGRAM_ID,
        data: data,
    });
};
