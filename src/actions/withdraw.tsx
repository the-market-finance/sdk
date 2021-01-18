import {
    Account,
    Connection,
    PublicKey,
    TransactionInstruction,
} from "@solana/web3.js";
import {LendingReserve, reserveMarketCap, withdrawInstruction} from "../models/lending";
import {AccountLayout, Token} from "@solana/spl-token";
import {LENDING_PROGRAM_ID, programIds, TOKEN_PROGRAM_ID} from "../constants";
import {findOrCreateAccountByMint} from "./account";
import {TokenAccount} from "../models";
import {sendTransaction} from "../contexts/connection";
import {cache, TokenAccountParser, MintParser} from "../contexts/accounts";
import {fromLamports} from "../utils/utils";



/**
 * вывод средств с депозита (withdraw)
 *
 * @param value:string  (количество)
 * @param reserve:LendingReserve (можно получить через getReserveAccounts(connection, address)[0].info)
 * @param reserveAddress:PublicKey (можно получить через getReserveAccounts(connection, address)[0].pubkey)
 * @param connection:Connection
 * @param wallet:Wallet
 * @param notifyCallback?: (message:object) => void | any (например функция notify из antd)
 * @return  void
 * @async
 */
export const withdraw = async (
    value:string,
    reserve: LendingReserve,
    reserveAddress: PublicKey,
    connection: Connection,
    wallet: any,
    notifyCallback?: (message: object) => void | any
) => {
    const sendMessageCallback = notifyCallback ? notifyCallback : (message: object) => console.log(message)
    sendMessageCallback({
        message: "Withdrawing funds...",
        description: "Please review transactions to approve.",
        type: "warn",
    });

    const accountsByOwner = await connection.getTokenAccountsByOwner(wallet?.publicKey, {
        programId: programIds().token,
    });

    // user from account
    const signers: Account[] = [];
    const instructions: TransactionInstruction[] = [];
    const cleanupInstructions: TransactionInstruction[] = [];

    // fetch from
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
                reserve.collateralMint.equals(acc.info.mint)
        )
        .sort((a, b) => b.info.amount.sub(a.info.amount).toNumber());


    if (!fromAccounts.length){throw Error('from account not found.')}

    const from = fromAccounts[0];

    // fetch from end

    //get Lampots treatmend value

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
        reserve.liquidityMint,
        signers,
        undefined,
        accountsByOwner.value ? accountsByOwner.value.map( a => TokenAccountParser(a.pubkey,a.account)) : undefined
    );

    instructions.push(
        withdrawInstruction(
            amountLamports,
            fromAccount,
            toAccount,
            reserveAddress,
            reserve.collateralMint,
            reserve.liquiditySupply,
            authority
        )
    );

    try {
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
    } catch {
        // TODO:
    }
};
