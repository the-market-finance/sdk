import {TokenAccount} from "../models";
import {sendTransaction} from "../contexts/connection";
import {
    cache,
    getCachedAccount,
    MintParser,
} from "../utils/accounts";
import {AccountLayout, MintInfo, Token} from "@solana/spl-token";
import {Account, Connection, PublicKey, SystemProgram, TransactionInstruction} from "@solana/web3.js";
import {getUserAccounts} from "./common";
import {programIds, SWAP_HOST_FEE_ADDRESS, WRAPPED_SOL_MINT} from "../constants";
import {swapInstruction} from "../models/tokenSwap";
import {precacheUserTokenAccounts} from "../contexts/accounts";
import {getPoolForBasket, queryPools} from "./pool";

const convertAmount = (amount: string, mint?: MintInfo) => {
    return parseFloat(amount) * Math.pow(10, mint?.decimals || 0);
};


interface SwapArgs {
    mintAddressA: string,
    amountA: string,
    mintAddressB: string,
    amountB: string
}

export const getAccountByMint = (userAccounts: Array<TokenAccount>, swapArgs: SwapArgs) => {
    const {mintAddressA, mintAddressB} = swapArgs;

    const indexA = userAccounts.findIndex(
        (acc) => acc.info.mint.toBase58() === mintAddressA
    );
    const indexB = userAccounts.findIndex(
        (acc) => acc.info.mint.toBase58() === mintAddressB
    );

    return [userAccounts[indexA] || undefined, userAccounts[indexB] || undefined];
};


export const swap = async (connection: Connection, wallet: any, swapArgs: SwapArgs,notifyCallback?: (message:object) => void | any, slippage?: number) => {

    const sendMessageCallback = notifyCallback ? notifyCallback : (message:object) => console.log(message)
    const SLIPPAGE = slippage || 0.25;
    const {mintAddressA, mintAddressB, amountA, amountB} = swapArgs;

    if (!mintAddressA || !mintAddressB || !amountA || !amountB) {
        throw new Error('mintAddressA,mintAddressB or amountA,amountB not found in swapArgs')
    }
    //fetch pools
    const mixPool = await Promise.all([
        queryPools(programIds().swap, connection),
        ...programIds().swap_legacy.map((leg) => queryPools(leg, connection,true)),
    ])
    const AllPools = mixPool.flat();
    const pool = await getPoolForBasket(connection, [mintAddressA,mintAddressB], AllPools)
    console.log('pool-sk',pool)

    // end fetch pools

    const [mintInfoA, mintInfoB] = await Promise.all([
        await new Promise<any>((resolve, reject) => {
            cache.query(connection, mintAddressA, MintParser)
                .then((acc) => resolve(acc?.info as any))
                .catch((err) => reject(err));
        }), await new Promise<any>((resolve, reject) => {
            cache.query(connection, mintAddressB, MintParser)
                .then((acc) => resolve(acc?.info as any))
                .catch((err) => reject(err));
        })]
    )
    const amountConvertedA = convertAmount(amountA, mintInfoA)
    const amountConvertedB = convertAmount(amountB, mintInfoB)

    const userAccounts = await getUserAccounts(connection, wallet);
    const [AccountA, AccountB] = getAccountByMint(userAccounts, swapArgs)

    // swap begin
    if (!pool || !AccountA) {
        sendMessageCallback({
            type: "error",
            message: `Pool doesn't exsist.`,
            description: `Swap trade cancelled`,
        });
        return;
    }
    // Uniswap whitepaper: https://uniswap.org/whitepaper.pdf
    // see: https://uniswap.org/docs/v2/advanced-topics/pricing/
    // as well as native uniswap v2 oracle: https://uniswap.org/docs/v2/core-concepts/oracles/
    const amountIn = amountConvertedA; // these two should include slippage
    const minAmountOut = amountConvertedB * (1 - SLIPPAGE);
    const holdingA =
        pool.pubkeys.holdingMints[0]?.toBase58() ===
        AccountA.info.mint.toBase58()
            ? pool.pubkeys.holdingAccounts[0]
            : pool.pubkeys.holdingAccounts[1];
    const holdingB =
        holdingA === pool.pubkeys.holdingAccounts[0]
            ? pool.pubkeys.holdingAccounts[1]
            : pool.pubkeys.holdingAccounts[0];

    const poolMint = await cache.queryMint(connection, pool.pubkeys.mint);

    if (!poolMint.mintAuthority || !pool.pubkeys.feeAccount) {
        throw new Error("Mint doesnt have authority");
    }
    const authority = poolMint.mintAuthority;

    const instructions: TransactionInstruction[] = [];
    const cleanupInstructions: TransactionInstruction[] = [];
    const signers: Account[] = [];

    const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
        AccountLayout.span
    );

    const fromAccount = getWrappedAccount(
        instructions,
        cleanupInstructions,
        AccountA,
        wallet.publicKey,
        amountIn + accountRentExempt,
        signers
    );

    let toAccount = findOrCreateAccountByMint(
        wallet.publicKey,
        wallet.publicKey,
        instructions,
        cleanupInstructions,
        accountRentExempt,
        new PublicKey(mintAddressB),
        signers
    );

    // create approval for transfer transactions
    approveAmount(
        instructions,
        cleanupInstructions,
        fromAccount,
        authority,
        wallet.publicKey,
        amountIn
    );

    let hostFeeAccount = SWAP_HOST_FEE_ADDRESS
        ? findOrCreateAccountByMint(
            wallet.publicKey,
            SWAP_HOST_FEE_ADDRESS,
            instructions,
            cleanupInstructions,
            accountRentExempt,
            pool.pubkeys.mint,
            signers
        )
        : undefined;

    // swap
    instructions.push(
        swapInstruction(
            pool.pubkeys.account,
            authority,
            fromAccount,
            holdingA,
            holdingB,
            toAccount,
            pool.pubkeys.mint,
            pool.pubkeys.feeAccount,
            pool.pubkeys.program,
            programIds().token,
            amountIn,
            minAmountOut,
            hostFeeAccount
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
        message: "Trade executed.",
        type: "success",
        description: `Transaction - ${tx.slice(0, 4)}...${tx.slice(-4)}`,
    });

}

function approveAmount(
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    account: PublicKey,
    delegate: PublicKey,
    owner: PublicKey,
    amount: number,
) {
    const tokenProgram = programIds().token;
    instructions.push(
        Token.createApproveInstruction(
            tokenProgram,
            account,
            delegate,
            owner,
            [],
            amount
        )
    );

    cleanupInstructions.push(
        Token.createRevokeInstruction(
            tokenProgram,
            account,
            owner,
            []),
    );
}

function getWrappedAccount(
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    toCheck: TokenAccount,
    payer: PublicKey,
    amount: number,
    signers: Account[]
) {
    if (!toCheck.info.isNative) {
        return toCheck.pubkey;
    }

    const account = new Account();
    instructions.push(
        SystemProgram.createAccount({
            fromPubkey: payer,
            newAccountPubkey: account.publicKey,
            lamports: amount,
            space: AccountLayout.span,
            programId: programIds().token,
        })
    );

    instructions.push(
        Token.createInitAccountInstruction(
            programIds().token,
            WRAPPED_SOL_MINT,
            account.publicKey,
            payer
        )
    );

    cleanupInstructions.push(
        Token.createCloseAccountInstruction(
            programIds().token,
            account.publicKey,
            payer,
            payer,
            []
        )
    );

    signers.push(account);

    return account.publicKey;
}

function findOrCreateAccountByMint(
    payer: PublicKey,
    owner: PublicKey,
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    accountRentExempt: number,
    mint: PublicKey, // use to identify same type
    signers: Account[],
    excluded?: Set<string>
): PublicKey {
    const accountToFind = mint.toBase58();
    const account = getCachedAccount(
        (acc) =>
            acc.info.mint.toBase58() === accountToFind &&
            acc.info.owner.toBase58() === owner.toBase58() &&
            (excluded === undefined || !excluded.has(acc.pubkey.toBase58()))
    );
    const isWrappedSol = accountToFind === WRAPPED_SOL_MINT.toBase58();

    let toAccount: PublicKey;
    if (account && !isWrappedSol) {
        toAccount = account.pubkey;
    } else {
        // creating depositor pool account
        const newToAccount = createSplAccount(
            instructions,
            payer,
            accountRentExempt,
            mint,
            owner,
            AccountLayout.span
        );

        toAccount = newToAccount.publicKey;
        signers.push(newToAccount);

        if (isWrappedSol) {
            cleanupInstructions.push(
                Token.createCloseAccountInstruction(
                    programIds().token,
                    toAccount,
                    payer,
                    payer,
                    []
                )
            );
        }
    }

    return toAccount;
}


function createSplAccount(
    instructions: TransactionInstruction[],
    payer: PublicKey,
    accountRentExempt: number,
    mint: PublicKey,
    owner: PublicKey,
    space: number
) {
    const account = new Account();
    instructions.push(
        SystemProgram.createAccount({
            fromPubkey: payer,
            newAccountPubkey: account.publicKey,
            lamports: accountRentExempt,
            space,
            programId: programIds().token,
        })
    );

    instructions.push(
        Token.createInitAccountInstruction(
            programIds().token,
            mint,
            account.publicKey,
            owner
        )
    );

    return account;
}
