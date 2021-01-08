
import { fromLamports, STABLE_COINS } from "../utils/utils";
import { cache, getMultipleAccounts, ParsedAccount } from "./accounts";
import { Market, Orderbook, TOKEN_MINTS } from "@project-serum/serum";
import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import { LendingMarket, LendingReserve } from "../models";


export const simulateMarketOrderFill = (
  amount: number,
  reserve: LendingReserve,
  dex: PublicKey
) => {
  const liquidityMint = cache.get(reserve.liquidityMint);
  const collateralMint = cache.get(reserve.collateralMint);
  if (!liquidityMint || !collateralMint) {
    return 0.0;
  }

  const marketInfo = cache.get(dex);
  if (!marketInfo) {
    return 0.0;
  }
  const decodedMarket = marketInfo.info;

  const baseMintDecimals =
    cache.get(decodedMarket.baseMint)?.info.decimals || 0;
  const quoteMintDecimals =
    cache.get(decodedMarket.quoteMint)?.info.decimals || 0;

  const lendingMarket = cache.get(reserve.lendingMarket) as ParsedAccount<
    LendingMarket
  >;

  const dexMarket = new Market(
    decodedMarket,
    baseMintDecimals,
    quoteMintDecimals,
    undefined,
    decodedMarket.programId
  );

  const bookAccount = lendingMarket.info.quoteMint.equals(reserve.liquidityMint)
    ? decodedMarket?.bids
    : decodedMarket?.asks;

  const bookInfo = cache.get(bookAccount)?.info;
  if (!bookInfo) {
    return 0;
  }

  const book = new Orderbook(dexMarket, bookInfo.accountFlags, bookInfo.slab);

  let cost = 0;
  let remaining = fromLamports(amount, liquidityMint.info);

  if (book) {
    const depth = book.getL2(1000);
    let price, sizeAtLevel: number;

    const op = book.isBids
      ? (price: number, size: number) => size / price
      : (price: number, size: number) => size * price;

    for ([price, sizeAtLevel] of depth) {
      let filled = remaining > sizeAtLevel ? sizeAtLevel : remaining;
      cost = cost + op(price, filled);
      remaining = remaining - filled;

      if (remaining <= 0) {
        break;
      }
    }
  }

  return cost;
};

const getMidPrice = (marketAddress?: string, mintAddress?: string) => {
  const SERUM_TOKEN = TOKEN_MINTS.find(
    (a) => a.address.toBase58() === mintAddress
  );

  if (STABLE_COINS.has(SERUM_TOKEN?.name || "")) {
    return 1.0;
  }

  if (!marketAddress) {
    return 0.0;
  }

  const marketInfo = cache.get(marketAddress);
  if (!marketInfo) {
    return 0.0;
  }

  const decodedMarket = marketInfo.info;

  const baseMintDecimals =
    cache.get(decodedMarket.baseMint)?.info.decimals || 0;
  const quoteMintDecimals =
    cache.get(decodedMarket.quoteMint)?.info.decimals || 0;

  const market = new Market(
    decodedMarket,
    baseMintDecimals,
    quoteMintDecimals,
    undefined,
    decodedMarket.programId
  );

  const bids = cache.get(decodedMarket.bids)?.info;
  const asks = cache.get(decodedMarket.asks)?.info;

  if (bids && asks) {
    const bidsBook = new Orderbook(market, bids.accountFlags, bids.slab);
    const asksBook = new Orderbook(market, asks.accountFlags, asks.slab);

    const bestBid = bidsBook.getL2(1);
    const bestAsk = asksBook.getL2(1);

    if (bestBid.length > 0 && bestAsk.length > 0) {
      return (bestBid[0][0] + bestAsk[0][0]) / 2.0;
    }
  }

  return 0;
};

const refreshAccounts = async (connection: Connection, keys: string[]) => {
  if (keys.length === 0) {
    return [];
  }

  return getMultipleAccounts(connection, keys, "single").then(
    ({ keys, array }) => {
      return array.map((item, index) => {
        const address = keys[index];
        return cache.add(new PublicKey(address), item);
      });
    }
  );
};

interface SerumMarket {
  marketInfo: {
    address: PublicKey;
    name: string;
    programId: PublicKey;
    deprecated: boolean;
  };

  // 1st query
  marketAccount?: AccountInfo<Buffer>;

  // 2nd query
  mintBase?: AccountInfo<Buffer>;
  mintQuote?: AccountInfo<Buffer>;
  bidAccount?: AccountInfo<Buffer>;
  askAccount?: AccountInfo<Buffer>;
  eventQueue?: AccountInfo<Buffer>;

  swap?: {
    dailyVolume: number;
  };

  midPrice?: (mint?: PublicKey) => number;
}
