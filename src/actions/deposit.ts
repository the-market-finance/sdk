import {
    Account, AccountInfo,
    Connection,
    PublicKey,
    TransactionInstruction,
} from "@solana/web3.js";

import {
    depositInstruction,
    initReserveInstruction, LendingReserveParser,
} from "../models/lending";
import {AccountLayout, Token} from "@solana/spl-token";
import {LENDING_PROGRAM_ID, programIds, TOKEN_PROGRAM_ID} from "../constants";
import {
    createUninitializedAccount,
    ensureSplAccount,
    findOrCreateAccountByMint,
} from "./account";
import {TokenAccount} from "../models";
import {sendTransaction} from "../contexts/connection";

import {cache, MintParser, TokenAccountParser} from "../contexts/accounts";

import {fromLamports} from "../utils/utils";


export const deposit = async (
    value: string,
    connection: Connection,
    wallet: any,
    address: string | PublicKey,
) => {
    // get reserve account
    const id = typeof address === "string" ? address : address?.toBase58();

    const accountInfo = await connection.getAccountInfo(new PublicKey(id)) as AccountInfo<Buffer>
    const reserveAccount = LendingReserveParser(new PublicKey(id), accountInfo)

    const reserve = reserveAccount?.info;

    const reserveAddress = reserveAccount?.pubkey as PublicKey;
    const accountsT = await connection.getTokenAccountsByOwner(wallet?.publicKey, {
        programId: programIds().token,
    });
    const prepareUserAccounts = accountsT.value.map(r => TokenAccountParser(r.pubkey, r.account));

    const selectUserAccounts =
        prepareUserAccounts
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
                reserve?.liquidityMint?.equals(acc.info.mint)
        )
        .sort((a, b) => b.info.amount.sub(a.info.amount).toNumber());

    // get reserve account end

    const balanceLamports = accounts.reduce(
        (res, item) => (res += item.info.amount.toNumber()),
        0
    );


    const MintId = reserve?.liquidityMint.toBase58()

    console.log('MintId', MintId)

    const mintInfo = await new Promise<any>((resolve, reject) => {
        cache.query(connection, MintId, MintParser)
            .then((acc) => resolve(acc.info as any))
            .catch((err) => reject(err));
    })

    console.log('mintInfo', mintInfo)

    const balance = fromLamports(balanceLamports, mintInfo);

    const amountLamports = Math.ceil(balanceLamports * (parseFloat(value) / balance))


    const isInitalized = true; // TODO: finish reserve init

    // user from account
    const signers: Account[] = [];
    const instructions: TransactionInstruction[] = [];
    const cleanupInstructions: TransactionInstruction[] = [];

    const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
        AccountLayout.span
    );

    const [authority] = await PublicKey.findProgramAddress(
        [reserve.lendingMarket.toBuffer()], // which account should be authority
        LENDING_PROGRAM_ID
    );

    const fromAccount = ensureSplAccount(
        instructions,
        cleanupInstructions,
        accounts[0],
        wallet.publicKey,
        amountLamports + accountRentExempt,
        signers
    );

    console.log('fromAccount', fromAccount.toBase58())

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

    let toAccount: PublicKey;
    if (isInitalized) {
        // get destination account
        toAccount = await findOrCreateAccountByMint(
            wallet.publicKey,
            wallet.publicKey,
            instructions,
            cleanupInstructions,
            accountRentExempt,
            reserve.collateralMint,
            signers
        );
    } else {
        toAccount = createUninitializedAccount(
            instructions,
            wallet.publicKey,
            accountRentExempt,
            signers
        );
    }

    if (isInitalized) {
        // deposit
        instructions.push(
            depositInstruction(
                amountLamports,
                fromAccount,
                toAccount,
                authority,
                reserveAddress,
                reserve.liquiditySupply,
                reserve.collateralMint
            )
        );
    } else {
        // TODO: finish reserve init
        const MAX_UTILIZATION_RATE = 80;
        instructions.push(
            initReserveInstruction(
                amountLamports,
                MAX_UTILIZATION_RATE,
                fromAccount,
                toAccount,
                reserveAddress,
                reserve.liquidityMint,
                reserve.liquiditySupply,
                reserve.collateralMint,
                reserve.collateralSupply,
                reserve.lendingMarket,
                authority,
                reserve.dexMarket
            )
        );
    }

    try {
        let tx = await sendTransaction(
            connection,
            wallet,
            instructions.concat(cleanupInstructions),
            signers,
            true
        );

        return {
            message: "Funds deposited.",
            type: "success",
            description: `Transaction - ${tx.slice(0, 7)}...${tx.slice(-7)}`,
        };
    } catch {
        // TODO:
        throw new Error();
    }
};
