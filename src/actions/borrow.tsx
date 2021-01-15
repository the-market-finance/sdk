import {
    Account,
    Connection,
    PublicKey,
    TransactionInstruction,
} from "@solana/web3.js";
import {
    calculateBorrowAPY,
    calculateDepositAPY,
    isLendingReserve, LendingMarketParser,
    LendingReserve,
    LendingReserveParser, reserveMarketCap
} from "../models/lending";
import {AccountLayout, MintInfo, MintLayout, Token} from "@solana/spl-token";
import {LENDING_PROGRAM_ID, programIds, TOKEN_PROGRAM_ID} from "../constants";
import {
    createTempMemoryAccount,
    createUninitializedAccount,
    createUninitializedMint,
    createUninitializedObligation,
    ensureSplAccount,
    findOrCreateAccountByMint,
} from "./account";
import {cache, MintParser, ParsedAccount, TokenAccountParser} from "../contexts/accounts";
import {
    TokenAccount,
    LendingObligationLayout,
    borrowInstruction,
    LendingMarket,
    BorrowAmountType,
    LendingObligation, approve,
} from "../models";
import {formatNumber, formatPct, fromLamports, toLamports, wadToLamports} from "../utils/utils";
import {sendTransaction} from "../contexts/connection";
import {DexMarketParser, OrderBookParser} from "../models/dex";

export const availableForBorrow = async (connection: Connection, wallet: any, publicKey: string | PublicKey): Promise<string> => {
    const pk = typeof publicKey === "string" ? publicKey : publicKey?.toBase58();

    const programAccounts = await connection.getProgramAccounts(
        LENDING_PROGRAM_ID
    );
    const lendingReserveAccount =
        programAccounts
            .filter(item =>
                isLendingReserve(item.account))
            .map((acc) =>
                LendingReserveParser(acc.pubkey, acc.account)).filter(acc => acc?.pubkey.toBase58() === pk)

    if (!lendingReserveAccount || lendingReserveAccount.length === 0 || !wallet.publicKey) return '--';
    const reserveLendingAccount = lendingReserveAccount[0]?.info;


    const accountsbyOwner = await connection.getTokenAccountsByOwner(wallet?.publicKey, {
        programId: programIds().token,
    });
    const prepareUserAccounts = accountsbyOwner.value.map(r => TokenAccountParser(r.pubkey, r.account));

    const selectUserAccounts = prepareUserAccounts
        .filter(
            (a) => a && a.info.owner.toBase58() === wallet.publicKey?.toBase58()
        )
        .map((a) => a as TokenAccount);


    const userAccounts = selectUserAccounts.filter(
        (a) => a !== undefined
    ) as TokenAccount[];

    const accounts = userAccounts
        .filter(
            (acc) =>
                reserveLendingAccount.collateralMint.equals(acc.info.mint)
        )
        .sort((a, b) => b.info.amount.sub(a.info.amount).toNumber());

    const balanceLamports = accounts.reduce(
        (res, item) => (res += item.info.amount.toNumber()),
        0
    );

    const collateralRatioLamports =
        reserveMarketCap(reserveLendingAccount) *
        (balanceLamports / (reserveLendingAccount?.collateralMintSupply.toNumber() || 1));

    // get mint
    const MintId = reserveLendingAccount?.collateralMint.toBase58()

    const mintInfo = await new Promise<any>((resolve, reject) => {
        cache.query(connection, MintId, MintParser)
            .then((acc) => resolve(acc?.info as any))
            .catch((err) => reject(err));
    })

    const availableForBorrow = fromLamports(collateralRatioLamports, mintInfo)

    return formatNumber.format(availableForBorrow)
}


export const borrowApyVal = (reserve: LendingReserve): string => {
    return formatPct.format(calculateBorrowAPY(reserve))
};


export const getBorrowApy = async (connection: Connection, publicKey: string | PublicKey): Promise<string> => {
    const pk = typeof publicKey === "string" ? publicKey : publicKey?.toBase58();
    const programAccounts = await connection.getProgramAccounts(
        LENDING_PROGRAM_ID
    );
    const lendingReserveAccount =
        programAccounts
            .filter(item =>
                isLendingReserve(item.account))
            .map((acc) =>
                LendingReserveParser(acc.pubkey, acc.account)).filter(acc => acc?.pubkey.toBase58() === pk)

    if (!lendingReserveAccount || lendingReserveAccount.length === 0) return '--';

    const apy = calculateBorrowAPY(lendingReserveAccount[0]?.info);

    return formatPct.format(apy)
}


export const borrow = async (
    connection: Connection,
    wallet: any,
    amount: number,
    collateralAddress: PublicKey | string,
    borrowReserve: ParsedAccount<LendingReserve>,
    // depositReserve: ParsedAccount<LendingReserve>,
    existingObligation?: ParsedAccount<LendingObligation>,
    obligationAccount?: PublicKey,
    notifyCallback?: (message: object) => void | any
) => {
    try {
        const sendMessageCallback = notifyCallback ? notifyCallback : (message: object) => console.log(message)
        sendMessageCallback({
            message: "Borrowing funds...",
            description: "Please review transactions to approve.",
            type: "warn",
        });

        // treatment collateralAddress
        const collateralId = typeof collateralAddress === "string" ? collateralAddress : collateralAddress?.toBase58();
        // fetch from
        const programAccounts = await connection.getProgramAccounts(
            LENDING_PROGRAM_ID
        );

        const lendingReserveAccount =
            programAccounts
                .filter(item =>
                    isLendingReserve(item.account))
                .map((acc) =>
                    LendingReserveParser(acc.pubkey, acc.account)).filter(acc => acc?.pubkey.toBase58() === collateralId)

        if (!lendingReserveAccount || lendingReserveAccount.length === 0 || !wallet.publicKey) throw 'depositReserve (collateral Reserve account not found)'
        const reserveLendingAccount = lendingReserveAccount[0]?.info;
        //set depositReserve(collateral reserve)
        const depositReserve:ParsedAccount<LendingReserve> = lendingReserveAccount[0] as ParsedAccount<LendingReserve>

        const accountsbyOwner = await connection.getTokenAccountsByOwner(wallet?.publicKey, {
            programId: programIds().token,
        });
        const prepareUserAccounts = accountsbyOwner.value.map(r => TokenAccountParser(r.pubkey, r.account));

        const selectUserAccounts = prepareUserAccounts
            .filter(
                (a) => a && a.info.owner.toBase58() === wallet.publicKey?.toBase58()
            )
            .map((a) => a as TokenAccount);

        const userAccounts = selectUserAccounts.filter(
            (a) => a !== undefined
        ) as TokenAccount[];

        const fromAccounts = userAccounts
            .filter(
                (acc) =>
                    reserveLendingAccount.collateralMint.equals(acc.info.mint)
            )
            .sort((a, b) => b.info.amount.sub(a.info.amount).toNumber());


        if (!fromAccounts.length){throw Error('from account not found.')}

        const from = fromAccounts[0];

        const accountsByOwner = await connection.getTokenAccountsByOwner(wallet?.publicKey, {
            programId: programIds().token,
        });

        let signers: Account[] = [];
        let instructions: TransactionInstruction[] = [];
        let cleanupInstructions: TransactionInstruction[] = [];

        // set default amount type
        const amountType: BorrowAmountType = 0;

        const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
            AccountLayout.span
        );

        const obligation = existingObligation
            ? existingObligation.pubkey
            : createUninitializedObligation(
                instructions,
                wallet.publicKey,
                await connection.getMinimumBalanceForRentExemption(
                    LendingObligationLayout.span
                ),
                signers
            );

        const obligationMint = existingObligation
            ? existingObligation.info.tokenMint
            : createUninitializedMint(
                instructions,
                wallet.publicKey,
                await connection.getMinimumBalanceForRentExemption(MintLayout.span),
                signers
            );

        const obligationTokenOutput = obligationAccount
            ? obligationAccount
            : createUninitializedAccount(
                instructions,
                wallet.publicKey,
                accountRentExempt,
                signers
            );

        let toAccount = await findOrCreateAccountByMint(
            wallet.publicKey,
            wallet.publicKey,
            instructions,
            cleanupInstructions,
            accountRentExempt,
            borrowReserve.info.liquidityMint,
            signers,
            undefined,
            accountsByOwner.value ? accountsByOwner.value.map(a => TokenAccountParser(a.pubkey, a.account)) : undefined
        );

        if (instructions.length > 0) {
            // create all accounts in one transaction
            let tx = await sendTransaction(connection, wallet, instructions, [
                ...signers,
            ], true, sendMessageCallback);

            sendMessageCallback({
                message: "Obligation accounts created",
                description: `Transaction ${tx.slice(0, 4)}...${tx.slice(-4)}`,
                type: "success",
            });
        }

        sendMessageCallback({
            message: "Borrowing funds...",
            description: "Please review transactions to approve.",
            type: "warn",
        });

        signers = [];
        instructions = [];
        cleanupInstructions = [];

        const [authority] = await PublicKey.findProgramAddress(
            [depositReserve.info.lendingMarket.toBuffer()],
            LENDING_PROGRAM_ID
        );

        let amountLamports: number = 0;
        let fromLamports: number = 0;
        if (amountType === BorrowAmountType.LiquidityBorrowAmount) {
            // approve max transfer
            // TODO: improve contrain by using dex market data
            const approvedAmount = from.info.amount.toNumber();

            fromLamports = approvedAmount - accountRentExempt;

            const mint = (await cache.query(
                connection,
                borrowReserve.info.liquidityMint,
                MintParser
            )) as ParsedAccount<MintInfo>;

            amountLamports = toLamports(amount, mint?.info);
        } else if (amountType === BorrowAmountType.CollateralDepositAmount) {
            const mint = (await cache.query(
                connection,
                depositReserve.info.collateralMint,
                MintParser
            )) as ParsedAccount<MintInfo>;
            amountLamports = toLamports(amount, mint?.info);
            fromLamports = amountLamports;
        }

        const fromAccount = ensureSplAccount(
            instructions,
            cleanupInstructions,
            from,
            wallet.publicKey,
            fromLamports + accountRentExempt,
            signers
        );

        // create approval for transfer transactions
        // approve(
        //     instructions,
        //     cleanupInstructions,
        //     fromAccount,
        //     authority,
        //     wallet.publicKey,
        //     fromLamports
        // );

        // create approval for transfer transactions
        instructions.push(
            Token.createApproveInstruction(
                TOKEN_PROGRAM_ID,
                fromAccount,
                authority,
                wallet.publicKey,
                [],
                fromLamports
            )
        );

        const dexMarketAddress = borrowReserve.info.dexMarketOption
            ? borrowReserve.info.dexMarket
            : depositReserve.info.dexMarket;

        const dexMarket = await cache.query(connection, dexMarketAddress, DexMarketParser);

        if (!dexMarket) {
            throw new Error(`Dex market doesn't exist.`);
        }

        const market = await cache.query(connection, depositReserve.info.lendingMarket, LendingMarketParser) as ParsedAccount<LendingMarket>;

        const dexOrderBookSide = market.info.quoteMint.equals(
            depositReserve.info.liquidityMint
        )
            ? dexMarket?.info.bids
            : dexMarket?.info.asks;

        const memory = createTempMemoryAccount(
            instructions,
            wallet.publicKey,
            signers
        );
        // deposit
        instructions.push(
            borrowInstruction(
                amountLamports,
                amountType,
                fromAccount,
                toAccount,
                depositReserve.pubkey,
                depositReserve.info.collateralSupply,
                borrowReserve.pubkey,
                borrowReserve.info.liquiditySupply,

                obligation,
                obligationMint,
                obligationTokenOutput,
                wallet.publicKey,

                authority,

                dexMarketAddress,
                dexOrderBookSide,

                memory
            )
        );
        try {
            let tx = await sendTransaction(
                connection,
                wallet,
                instructions.concat(cleanupInstructions),
                signers,
                true,
                sendMessageCallback
            );

            sendMessageCallback({
                message: "Funds borrowed.",
                type: "success",
                description: `Transaction - ${tx.slice(0, 4)}...${tx.slice(-4)}`,
            });
        } catch {
            // TODO:
            throw new Error();
        }
    } catch (e) {
        console.log('borrow action error', e)
    }
};