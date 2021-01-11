import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";

import { LendingReserve } from "../models/lending";
import { repayInstruction } from "../models/lending/repay";
import { AccountLayout, Token } from "@solana/spl-token";
import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID } from "../constants";
import { findOrCreateAccountByMint } from "./account";
import { LendingObligation, TokenAccount } from "../models";
import { ParsedAccount } from "../contexts/accounts";
import {sendTransaction} from "../contexts/connection";

export const repay = async (
  from: TokenAccount, // CollateralAccount
  amountLamports: number, // in collateral token (lamports)

  // which loan to repay
  obligation: ParsedAccount<LendingObligation>,

  obligationToken: TokenAccount,

  repayReserve: ParsedAccount<LendingReserve>,

  withdrawReserve: ParsedAccount<LendingReserve>,

  connection: Connection,
  wallet: any,
  notifyCallback?: (message: object) => void | any
) => {
  const sendMessageCallback = notifyCallback ? notifyCallback : (message: object) => console.log(message)
  sendMessageCallback({
    message: "Repaing funds...",
    description: "Please review transactions to approve.",
    type: "warn",
  });

  // user from account
  const signers: Account[] = [];
  const instructions: TransactionInstruction[] = [];
  const cleanupInstructions: TransactionInstruction[] = [];

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span
  );

  const [authority] = await PublicKey.findProgramAddress(
    [repayReserve.info.lendingMarket.toBuffer()],
    LENDING_PROGRAM_ID
  );

  const fromAccount = from.pubkey;

  // create approval for transfer transactions
  instructions.push(
    Token.createApproveInstruction(
      TOKEN_PROGRAM_ID,
      fromAccount,
      authority,
      wallet.publicKey,
      [],
      amountLamports
    )
  );

  // get destination account
  const toAccount = await findOrCreateAccountByMint(
    wallet.publicKey,
    wallet.publicKey,
    instructions,
    cleanupInstructions,
    accountRentExempt,
    withdrawReserve.info.collateralMint,
    signers
  );

  // create approval for transfer transactions
  instructions.push(
    Token.createApproveInstruction(
      TOKEN_PROGRAM_ID,
      obligationToken.pubkey,
      authority,
      wallet.publicKey,
      [],
      obligationToken.info.amount.toNumber()
    )
  );

  // TODO: add obligation

  instructions.push(
    repayInstruction(
      amountLamports,
      fromAccount,
      toAccount,
      repayReserve.pubkey,
      repayReserve.info.liquiditySupply,
      withdrawReserve.pubkey,
      withdrawReserve.info.collateralSupply,
      obligation.pubkey,
      obligation.info.tokenMint,
      obligationToken.pubkey,
      authority
    )
  );

  let tx = await sendTransaction(
    connection,
    wallet,
    instructions.concat(cleanupInstructions),
    signers,
    true,
      sendMessageCallback
  );

  return sendMessageCallback({
    message: "Funds repaid.",
    type: "success",
    description: `Transaction - ${tx.slice(0,4)}...${tx.slice(-4)}`,
  });
};
