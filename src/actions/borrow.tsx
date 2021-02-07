import {
    Account,
    Connection,
    PublicKey,
    TransactionInstruction,
} from "@solana/web3.js";
import {
    calculateBorrowAPY,
    isLendingObligation,
    isLendingReserve, LendingMarketParser, LendingObligationParser,
    LendingReserve,
    LendingReserveParser, reserveMarketCap
} from "../models/lending";
import {AccountLayout, MintInfo, MintLayout, Token} from "@solana/spl-token";
import {TOKEN_PROGRAM_ID} from "../constants";
import {
    createTempMemoryAccount,
    createUninitializedAccount,
    createUninitializedMint,
    createUninitializedObligation,
    ensureSplAccount,
    findOrCreateAccountByMint,
} from "./account";
import {cache, MintParser, ParsedAccount} from "../contexts/accounts";
import {
    TokenAccount,
    LendingObligationLayout,
    borrowInstruction,
    LendingMarket,
    BorrowAmountType,
    approve,
} from "../models";
import {formatNumber, formatPct, fromLamports, toLamports} from "../utils/utils";
import {sendTransaction} from "../contexts/connection";
import {DexMarketParser} from "../models/dex";
import {getReserveAccounts, getUserAccounts} from "./common";


/**
 * information request displaying how much you can borrow
 *
 * @param connection: Connection
 * @param wallet: Wallet
 * @param publicKey: string | PublicKey (token address)
 * @param programId: PublicKey (lending program id)
 * @return Promise<string>
 * @async
 */
export const availableForBorrow = async (connection: Connection, wallet: any, publicKey: string | PublicKey, programId: PublicKey): Promise<string> => {
    const pk = typeof publicKey === "string" ? publicKey : publicKey?.toBase58();

    const programAccounts = await connection.getProgramAccounts(
        programId
    );
    const lendingReserveAccount =
        programAccounts
            .filter(item =>
                isLendingReserve(item.account))
            .map((acc) =>
                LendingReserveParser(acc.pubkey, acc.account)).filter(acc => acc?.pubkey.toBase58() === pk)

    if (!lendingReserveAccount || lendingReserveAccount.length === 0 || !wallet.publicKey) return '--';
    const reserveLendingAccount = lendingReserveAccount[0]?.info;

    const userAccounts = await getUserAccounts(connection, wallet);

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

/**
 * information request displaying the current rate on the APY borrow
 *
 * @param reserve: LendingReserve (can be obtained via getReserveAccounts)
 * @return string
 */
export const borrowApyVal = (reserve: LendingReserve): string => {
    return formatPct.format(calculateBorrowAPY(reserve))
};

/**
 * information request displaying the current rate on the APY borrow
 *
 * @param connection: Connection
 * @param publicKey: string | PublicKey (token address)
 * @param programId: PublicKey (lending program id)
 * @return Promise<string>
 * @async
 */
export const getBorrowApy = async (connection: Connection, publicKey: string | PublicKey, programId: PublicKey): Promise<string> => {
    const pk = typeof publicKey === "string" ? publicKey : publicKey?.toBase58();
    const programAccounts = await connection.getProgramAccounts(
        programId
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

/**
 * creating a borrow (borrow)
 *
 * @param connection: Connection
 * @param wallet: Wallet
 * @param amount: number (borrow amount as Float)
 * @param collateralAddress: PublicKey | string (address or PublicKey of the token for collateral)
 * @param borrowReserve: ParsedAccount<LendingReserve> (can be obtained through getReserveAccounts(connection, address)[0]))
 * @param programId: PublicKey (lending program id)
 * @param notifyCallback?: (message:object) => void | any (e.g. the notify function from antd)
 * @param marketMintAddress?: string (our market custom token address)
 * @param marketMintAccountAddress?:string (our mint account address)
 * @return void
 * @async
 */
export const borrow = async (
    connection: Connection,
    wallet: any,
    amount: number,
    collateralAddress: PublicKey | string,
    borrowReserve: ParsedAccount<LendingReserve>,
    programId: PublicKey,
    notifyCallback?: (message: object) => void | any,
    marketMintAddress?: string,
    marketMintAccountAddress?: string
) => {

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
        programId
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
    const depositReserve: ParsedAccount<LendingReserve> = lendingReserveAccount[0] as ParsedAccount<LendingReserve>

    const userAccounts = await getUserAccounts(connection, wallet);

    const fromAccounts = userAccounts
        .filter(
            (acc) =>
                reserveLendingAccount.collateralMint.equals(acc.info.mint)
        )
        .sort((a, b) => b.info.amount.sub(a.info.amount).toNumber());


    if (!fromAccounts.length) {
        throw Error('from account not found.')
    }

    const from = fromAccounts[0];

    let signers: Account[] = [];
    let instructions: TransactionInstruction[] = [];
    let cleanupInstructions: TransactionInstruction[] = [];

    // set default amount type
    const amountType: BorrowAmountType = 0;


    //fetch obligations
    const obligations =
        programAccounts
            .filter(item =>
                isLendingObligation(item.account))
            .map((acc) =>
                LendingObligationParser(acc.pubkey, acc.account))

    //
    const accountsByMint = userAccounts.reduce((res, acc) => {
        const id = acc.info.mint.toBase58();
        res.set(id, [...(res.get(id) || []), acc]);
        return res;
    }, new Map<string, TokenAccount[]>());

    const userObligations = obligations
        .filter(
            (acc) => accountsByMint.get(acc.info.tokenMint.toBase58()) !== undefined
        )
        .map((ob) => {
            return {
                obligation: ob,
                // @ts-ignore
                userAccounts: [...accountsByMint.get(ob.info.tokenMint.toBase58())],
            };
        });

    const userObligationsByReserve = userObligations.filter(
        (item) =>
            item.obligation.info.borrowReserve.toBase58() === borrowReserve.pubkey.toBase58() &&
            item.obligation.info.collateralReserve.toBase58() === collateralId
    );

    //fetch obligations end

    const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
        AccountLayout.span
    );

    const obligation = userObligationsByReserve.length > 0
        ? userObligationsByReserve[0].obligation.pubkey
        : createUninitializedObligation(
            instructions,
            wallet.publicKey,
            await connection.getMinimumBalanceForRentExemption(
                LendingObligationLayout.span
            ),
            signers,
            programId
        );

    const obligationMint = userObligationsByReserve.length > 0
        ? userObligationsByReserve[0].obligation.info.tokenMint
        : createUninitializedMint(
            instructions,
            wallet.publicKey,
            await connection.getMinimumBalanceForRentExemption(MintLayout.span),
            signers
        );

    const obligationTokenOutput = userObligationsByReserve.length > 0
        ? userObligationsByReserve[0].userAccounts[0].pubkey
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
        userAccounts || undefined
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
        programId
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
    approve(
        instructions,
        cleanupInstructions,
        fromAccount,
        authority,
        wallet.publicKey,
        fromLamports
    );

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
            memory,
            programId,
            ourMintDepositAccount,
            marketReserve?.info.liquiditySupply,
            marketAuthority,
            marketReserve?.pubkey
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
    } catch (e) {
        // TODO:
        throw new Error(`into transaction error => ${e}`);
    }
};