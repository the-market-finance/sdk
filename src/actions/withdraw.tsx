import {
    Account,
    Connection,
    PublicKey,
    TransactionInstruction,
} from "@solana/web3.js";
import {
    LendingMarket,
    LendingMarketParser,
    LendingReserve,
    reserveMarketCap,
    withdrawInstruction
} from "../models/lending";
import {AccountLayout} from "@solana/spl-token";
import {programIds} from "../constants";
import {createTempMemoryAccount, findOrCreateAccountByMint} from "./account";
import {approve, TokenAccount} from "../models";
import {sendTransaction} from "../contexts/connection";
import {cache, TokenAccountParser, MintParser, ParsedAccount} from "../contexts/accounts";
import {fromLamports} from "../utils/utils";
import {getReserveAccounts} from "./common";
import {DexMarketParser} from "../models/dex";
import {initUserEntity} from "./iniEntity";
import {updateBN} from "./upBN";



/**
 * withdrawal of funds from the deposit (withdraw)
 *
 * @param value: string  (amount)
 * @param reserve: LendingReserve (can be obtained through getReserveAccounts(connection, address)[0].info)
 * @param reserveAddress: PublicKey (can be obtained through getReserveAccounts(connection, address)[0].pubkey)
 * @param connection: Connection
 * @param wallet: Wallet
 * @param programId: PublicKey (lending program id)
 * @param notifyCallback?: (message:object) => void | any (e.g. the notify function from antd)
 * @param marketMintAddress?: string (our market custom token address)
 * @param marketMintAccountAddress?:string (our mint account address)
 * @return void
 * @async
 */
export const withdraw = async (
    value:string,
    reserve: LendingReserve,
    reserveAddress: PublicKey,
    connection: Connection,
    wallet: any,
    programId: PublicKey,
    notifyCallback?: (message: object) => void | any,
    marketMintAddress?: string,
    marketMintAccountAddress?: string
) => {
    const sendMessageCallback = notifyCallback ? notifyCallback : (message: object) => console.log(message)

    // user from account
    const signers: Account[] = [];
    const instructions: TransactionInstruction[] = [];
    const cleanupInstructions: TransactionInstruction[] = [];

    const accountsByOwner = await connection.getTokenAccountsByOwner(wallet?.publicKey, {
        programId: programIds().token,
    });

    // fetch from
    const prepareUserAccounts = accountsByOwner.value.map(r => TokenAccountParser(r.pubkey, r.account));

    const selectUserAccounts = prepareUserAccounts
        .filter(
            (a) => a && a.info.owner.toBase58() === wallet.publicKey?.toBase58()
        )
        .map((a) => a as TokenAccount);


    const userAccounts = selectUserAccounts.filter(
        (a) => a !== undefined
    ) as TokenAccount[];

    // const userAccounts = await getUserAccounts(connection, wallet)

    const fromAccounts = userAccounts
        .filter(
            (acc) =>
                reserve.collateralMint.equals(acc.info.mint)
        )
        .sort((a, b) => b.info.amount.sub(a.info.amount).toNumber());


    if (!fromAccounts.length){throw Error('from account not found.')}

    const from = fromAccounts[0];
    // fetch from end

    //get Lampots treatment value
    const balanceLamports = fromAccounts.reduce(
        (res, item) => (res += item.info.amount.toNumber()),
        0
    );

    const MintId = reserve?.collateralMint.toBase58()

    const mintInfo = await new Promise<any>((resolve,reject) =>{
        cache.query(connection, MintId, MintParser)
            .then((acc) => resolve(acc?.info as any))
            .catch((err) => reject(err));
    })

    const collateralRatioLamports =
        reserveMarketCap(reserve) *
        (balanceLamports / (reserve?.collateralMintSupply.toNumber() || 1));

    const collateralBalanceInLiquidity = fromLamports(collateralRatioLamports, mintInfo);

    const amountLamports = Math.ceil(balanceLamports * (parseFloat(value) / collateralBalanceInLiquidity))

    ///get Lampots treatmend value end

    const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
        AccountLayout.span
    );

    const [authority] = await PublicKey.findProgramAddress(
        [reserve.lendingMarket.toBuffer()],
        programId,
    );

    const fromAccount = from.pubkey;

    // lending detail init entity
    const userEntity = (marketMintAddress && marketMintAccountAddress)
        ? await initUserEntity(connection, wallet, programId, notifyCallback)
        : undefined
    // lending detail init entity end
    sendMessageCallback({
        message: "Withdrawing funds...",
        description: "Please review transactions to approve.",
        type: "warn",
    });
    // create approval for transfer transactions
    approve(
        instructions,
        cleanupInstructions,
        fromAccount,
        authority,
        wallet.publicKey,
        amountLamports
    );


    // get destination account
    const toAccount = await findOrCreateAccountByMint(
        wallet.publicKey,
        wallet.publicKey,
        instructions,
        cleanupInstructions,
        accountRentExempt,
        reserve.liquidityMint,
        signers,
        undefined,
        accountsByOwner.value ? accountsByOwner.value.map(a => TokenAccountParser(a.pubkey, a.account)) : undefined
    );

    // fetch market token Account
    // const marketReserve =  marketMintAccountAddress ? (await getReserveAccounts(connection, programId, marketMintAccountAddress)).pop() : undefined;

    // fetch our mint token account
    // const ourMintDepositAccount = marketMintAddress ? await findOrCreateAccountByMint(
    //     wallet.publicKey,
    //     wallet.publicKey,
    //     instructions,
    //     cleanupInstructions,
    //     accountRentExempt,
    //     new PublicKey(marketMintAddress),
    //     signers,
    //     undefined,
    //     userAccounts || undefined
    // ) : undefined

    // const [marketAuthority] = await PublicKey.findProgramAddress(
    //     marketReserve?.info ? [ marketReserve.info.lendingMarket.toBuffer()] : [], // which account should be authority for market
    //     programId
    // );

    //fetch dex market area
    const dexMarketAddress = reserve.dexMarket


    const dexMarket = await cache.query(connection, dexMarketAddress, DexMarketParser);

    if (!dexMarket) {
        throw new Error(`Dex market doesn't exist.`);
    }

    const dexOrderBookSide = dexMarket?.info.asks;

    const memory = createTempMemoryAccount(
        instructions,
        wallet.publicKey,
        signers
    );

    instructions.push(
        withdrawInstruction(
            amountLamports,
            fromAccount,
            toAccount,
            reserveAddress,
            reserve.collateralMint,
            reserve.liquiditySupply,
            authority,
            programId,
            userEntity
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
        message: "Funds withdraw.",
        type: "success",
        description: `Transaction - ${tx.slice(0, 4)}...${tx.slice(-4)}`,
    });
    if(userEntity){await updateBN(connection, wallet, reserveAddress, dexMarket.pubkey, dexOrderBookSide, memory, userEntity, 14.551 * 1000000, 2, programId, notifyCallback)}
};
