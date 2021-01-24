import {
    Account,
    Connection,
    PublicKey,
    TransactionInstruction,
} from "@solana/web3.js";

import {isLendingReserve, LendingObligationParser, LendingReserve, LendingReserveParser} from "../models/lending";
import {repayInstruction} from "../models/lending/repay";
import {AccountLayout, Token} from "@solana/spl-token";
import {LENDING_PROGRAM_ID, programIds, TOKEN_PROGRAM_ID} from "../constants";
import {findOrCreateAccountByMint} from "./account";
import {LendingObligation, TokenAccount} from "../models";
import {cache, MintParser, ParsedAccount, TokenAccountParser} from "../contexts/accounts";
import {sendTransaction} from "../contexts/connection";
import {fromLamports, wadToLamports} from "../utils/utils";
import {getUserAccounts} from "./common";




/**
 * погашение кредита (repay)
 *
 * @param value:string  (количество)
 * @param obligationAddress:PublicKey | string (адресс токена погашение кредита)
 * @param collateralAddress: PublicKey | string (адресс токена залога)
 * @param connection:Connection
 * @param wallet:Wallet
 * @param notifyCallback?: (message:object) => void | any (например функция notify из antd)
 * @return  void
 * @async
 */
export const repay = async (
    value: string, // in collateral token (lamports)(сумма)
    obligationAddress:PublicKey | string, // (адресс токена погашение кредита)
    collateralAddress: PublicKey | string,// (адресс токена залога)
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
    // treatment collateralAddress
    const collateralId = typeof collateralAddress === "string" ? collateralAddress : collateralAddress?.toBase58();
    // fetch collateralReserve account(withdrawReserve)
    const programAccounts = await connection.getProgramAccounts(
        LENDING_PROGRAM_ID
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

    sendMessageCallback({
        message: "Funds repaid.",
        type: "success",
        description: `Transaction - ${tx.slice(0, 4)}...${tx.slice(-4)}`,
    });
};
