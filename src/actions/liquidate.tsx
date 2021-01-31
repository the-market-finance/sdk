import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";

import { liquidateInstruction } from "../models/lending/liquidate";
import { AccountLayout, Token } from "@solana/spl-token";
import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID } from "../constants";
import { createTempMemoryAccount, ensureSplAccount, findOrCreateAccountByMint } from "./account";
import {cache, ParsedAccount} from "../contexts/accounts";
import {sendTransaction} from "../contexts/connection";
import {wadToLamports} from "../utils/utils";
import {EnrichedLendingObligation, queryLendingAccounts, SerumMarket} from "./enriched";
import {getReserveAccounts, getUserAccounts, initalQuery} from "./common";
import {isLendingReserve, LendingMarket, LendingReserve, LendingReserveParser} from "../models/lending";
import {MARKETS, TOKEN_MINTS} from "@project-serum/serum";
import {MINT_TO_MARKET} from "../models/marketOverrides";

export const liquidate = async (
    connection: Connection,
    wallet: any,
    obligation: EnrichedLendingObligation,
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

  const programAccounts = await connection.getProgramAccounts(
      LENDING_PROGRAM_ID
  );

  const reserveAccounts = programAccounts
      .filter(item =>
          isLendingReserve(item.account))
      .map((acc) =>
          LendingReserveParser(acc.pubkey, acc.account)).filter(acc => acc !== undefined
      ) as ParsedAccount<LendingReserve>[]

  const [repayReserve] = reserveAccounts.filter(acc => acc?.pubkey.toBase58() === obligation?.info.borrowReserve.toBase58());
  const [withdrawReserve] = reserveAccounts.filter(acc => acc?.pubkey.toBase58() === obligation?.info.collateralReserve.toBase58());
  //get markets collations
  const marketMints = reserveAccounts.map((reserve) => reserve.info.liquidityMint.toBase58())

  const marketByMint = marketMints.reduce((acc, key) => {
    const mintAddress = key;

    const SERUM_TOKEN = TOKEN_MINTS.find(
        (a) => a.address.toBase58() === mintAddress
    );
    const marketAddress = MINT_TO_MARKET[mintAddress];
    const marketName = `${SERUM_TOKEN?.name}/USDC`;
    const marketInfo = MARKETS.find(
        (m) => m.name === marketName || m.address.toBase58() === marketAddress
    );
    if (marketInfo) {
      acc.set(mintAddress, {
        marketInfo,
      });
    }
    return acc;
  }, new Map<string, SerumMarket>()) as Map<string, SerumMarket>;

  await queryLendingAccounts(connection, programAccounts)

  await initalQuery(connection, marketByMint);
  // get markets collection end

  const amountLamports = wadToLamports(obligation.info.borrowAmountWad).toNumber();
  // fetch from
  const userAccounts = await getUserAccounts(connection, wallet);
  const fromAccounts = userAccounts
      .filter(
          (acc) =>
              repayReserve.info.liquidityMint.equals(acc.info.mint)
      )

  console.log('fromAccounts', fromAccounts)


  if (!fromAccounts.length){throw Error('from account not found.')}

  const [from] = fromAccounts;
  console.log('fromAccount(from)',from)


  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
      AccountLayout.span
  );

  const [authority] = await PublicKey.findProgramAddress(
      [repayReserve.info.lendingMarket.toBuffer()],
      LENDING_PROGRAM_ID
  );

  const fromAccount = ensureSplAccount(
      instructions,
      cleanupInstructions,
      from,
      wallet.publicKey,
      amountLamports + accountRentExempt,
      signers
  );

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

  const dexMarketAddress = repayReserve.info.dexMarketOption
      ? repayReserve.info.dexMarket
      : withdrawReserve.info.dexMarket;
  const dexMarket = cache.get(dexMarketAddress);


  if (!dexMarket) {
    throw new Error(`Dex market doesn't exist.`);
  }

  const market = cache.get(withdrawReserve.info.lendingMarket) as ParsedAccount<
      LendingMarket
      >;


  const dexOrderBookSide = market.info.quoteMint.equals(
      repayReserve.info.liquidityMint
  )
      ? dexMarket?.info.bids
      : dexMarket?.info.asks;


  console.log(dexMarketAddress.toBase58())

  const memory = createTempMemoryAccount(
      instructions,
      wallet.publicKey,
      signers
  );

  instructions.push(
      liquidateInstruction(
          amountLamports,
          fromAccount,
          toAccount,
          repayReserve.pubkey,
          repayReserve.info.liquiditySupply,
          withdrawReserve.pubkey,
          withdrawReserve.info.collateralSupply,
          obligation.account.pubkey,
          authority,
          dexMarketAddress,
          dexOrderBookSide,
          memory
      )
  );

  let tx = await sendTransaction(
      connection,
      wallet,
      instructions.concat(cleanupInstructions),
      signers,
      true,
      (msg) => sendMessageCallback(msg)
  );

  sendMessageCallback({
    message: "Funds liquidated.",
    type: "success",
    description: `Transaction - ${tx.slice(0,4)}...${tx.slice(-4)}`,
  });
};
