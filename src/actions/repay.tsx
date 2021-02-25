import {
    Account,
    Connection,
    PublicKey,
    TransactionInstruction,
} from "@solana/web3.js";

import {isLendingReserve, LendingObligationParser, LendingReserve, LendingReserveParser} from "../models/lending";
import {repayInstruction} from "../models/lending/repay";
import {AccountLayout, Token} from "@solana/spl-token";
import {TOKEN_PROGRAM_ID} from "../constants";
import {createTempMemoryAccount, findOrCreateAccountByMint} from "./account";
import {cache, MintParser, ParsedAccount} from "../contexts/accounts";
import {sendTransaction} from "../contexts/connection";
import {fromLamports, wadToLamports} from "../utils/utils";
import {getReserveAccounts, getUserAccounts} from "./common";
import {DexMarketParser} from "../models/dex";




/**
 * repayment of the borrow (repay)
 *
 * @param value: string (amount)
 * @param obligationAddress: PublicKey | string (token address borrow repayment)
 * @param collateralAddress: PublicKey | string (collateral token address)
 * @param connection: Connection
 * @param wallet: Wallet
 * @param programId: PublicKey (lending program id)
 * @param notifyCallback?: (message:object) => void | any (e.g. the notify function from antd)
 * @param marketMintAddress?: string (our market custom token address)
 * @param marketMintAccountAddress?:string (our mint account address)
 * @return void
 * @async
 */
export const repay = async (
    value: string, // in collateral token (lamports)(сумма)
    obligationAddress:PublicKey | string, // (адресс токена погашение кредита)
    collateralAddress: PublicKey | string,// (адресс токена залога)
    connection: Connection,
    wallet: any,
    programId: PublicKey,
    notifyCallback?: (message: object) => void | any,
    marketMintAddress?: string,
    marketMintAccountAddress?: string
) => {
    const sendMessageCallback = notifyCallback ? notifyCallback : (message: object) => console.log(message)
    sendMessageCallback({
        message: "Repaing funds...",
        description: "Please review transactions to approve.",
        type: "warn",
    });
    // treatment collateralAddress
    const collateralId = typeof collateralAddress === "string" ? collateralAddress : collateralAddress?.toBase58();
    // fetch collateralReserve account(withdrawReserve)
    const programAccounts = await connection.getProgramAccounts(
        programId
    );
    const collateralReserve =
        programAccounts
            .filter(item =>
                isLendingReserve(item.account))
            .map((acc) =>
                LendingReserveParser(acc.pubkey, acc.account)).filter(acc => acc?.pubkey.toBase58() === collateralId)
    if (!collateralReserve || collateralReserve.length === 0 || !wallet.publicKey) throw 'collateralReserve account(withdrawReserve) - not found'
    //set collateralReserve account(withdrawReserve)
    const withdrawReserve: ParsedAccount<LendingReserve> = collateralReserve[0] as ParsedAccount<LendingReserve>

    // fetch collateralReserve account(withdrawReserve) end
    // get obligation
    const obligationId = typeof obligationAddress === "string" ? obligationAddress : obligationAddress?.toBase58();
    const obligation = await cache.query(connection, obligationId, LendingObligationParser)
    if (!obligation) throw 'obligation not found'
    const repayReserve = await cache.query(connection, obligation?.info.borrowReserve.toBase58(), LendingReserveParser)
    if (!repayReserve) throw 'repayReserve not found'
    // get obligation end

    // get to repayLamports (amountLamports)
    const borrowAmountLamports = wadToLamports(obligation.info.borrowAmountWad).toNumber();
    const borrowMintId = repayReserve?.info.liquidityMint.toBase58()
    const borrowMintInfo = await new Promise<any>((resolve,reject) =>{
        cache.query(connection, borrowMintId, MintParser)
            .then((acc) => resolve(acc?.info as any))
            .catch((err) => reject(err));
    })
    const borrowAmount = fromLamports(
        borrowAmountLamports,
        borrowMintInfo
    );

    const amountLamports = Math.ceil(borrowAmountLamports * (parseFloat(value) / borrowAmount));

    // get to amountLamports end


    // fetch from

    const userAccounts = await getUserAccounts(connection, wallet);

    // get obligationAccount

    const obligationAccountIdx = userAccounts.findIndex(
        (acc) => acc.info.mint.toBase58() === obligation?.info.tokenMint.toBase58()
    );

    if (obligationAccountIdx === -1) { throw new Error('obligationAccount not found')}

    const obligationToken = userAccounts[obligationAccountIdx];


    // get obligationAccount end

    const fromAccounts = userAccounts
        .filter(
            (acc) =>
                repayReserve.info.liquidityMint.equals(acc.info.mint)
        )
        .sort((a, b) => b.info.amount.sub(a.info.amount).toNumber());


    if (!fromAccounts.length){throw Error('from account not found.')}

    const from = fromAccounts[0];


    // fetch from end

    // user from account
    const signers: Account[] = [];
    const instructions: TransactionInstruction[] = [];
    const cleanupInstructions: TransactionInstruction[] = [];

    const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
        AccountLayout.span
    );

    const [authority] = await PublicKey.findProgramAddress(
        [repayReserve.info.lendingMarket.toBuffer()],
        programId
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
        signers,
        undefined,
        userAccounts || undefined
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
    // fetch market token Account
    const marketReserve =  marketMintAccountAddress ? (await getReserveAccounts(connection, programId, marketMintAccountAddress)).pop() : undefined;

    // fetch our mint token account
    const ourMintDepositAccount = marketMintAddress ? await findOrCreateAccountByMint(
        wallet.publicKey,
        wallet.publicKey,
        instructions,
        cleanupInstructions,
        accountRentExempt,
        new PublicKey(marketMintAddress),
        signers,
        undefined,
        userAccounts || undefined
    ) : undefined

    const [marketAuthority] = await PublicKey.findProgramAddress(
        marketReserve?.info ? [ marketReserve.info.lendingMarket.toBuffer()] : [], // which account should be authority for market
        programId
    );
    //fetch dex market area
    // const dexMarketAddress = repayReserve.info.dexMarket
    //
    //
    // const dexMarket = await cache.query(connection, dexMarketAddress, DexMarketParser);
    //
    // if (!dexMarket) {
    //     throw new Error(`Dex market doesn't exist.`);
    // }
    //
    // const dexOrderBookSide = dexMarket?.info.asks;
    //
    // const memory = createTempMemoryAccount(
    //     instructions,
    //     wallet.publicKey,
    //     signers
    // );

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
            authority,
            programId,
            ourMintDepositAccount,
            marketReserve?.info.liquiditySupply,
            marketAuthority,
            marketReserve?.pubkey,
            // dexMarket.pubkey,
            // dexOrderBookSide,
            // memory
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

    sendMessageCallback({
        message: "Funds repaid.",
        type: "success",
        description: `Transaction - ${tx.slice(0, 4)}...${tx.slice(-4)}`,
    });
};
