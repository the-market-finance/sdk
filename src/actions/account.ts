import {AccountLayout, MintLayout, Token} from "@solana/spl-token";
import {
    Account,
    PublicKey,
    SystemProgram,
    TransactionInstruction,
} from "@solana/web3.js";
import {
    LENDING_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    WRAPPED_SOL_MINT,
} from "../constants";
import {LendingObligationLayout, TokenAccount} from "../models";
import {cache, TokenAccountParser} from "../contexts/accounts";

export function ensureSplAccount(
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

    const account = createUninitializedAccount(
        instructions,
        payer,
        amount,
        signers
    );

    instructions.push(
        Token.createInitAccountInstruction(
            TOKEN_PROGRAM_ID,
            WRAPPED_SOL_MINT,
            account,
            payer
        )
    );

    cleanupInstructions.push(
        Token.createCloseAccountInstruction(
            TOKEN_PROGRAM_ID,
            account,
            payer,
            payer,
            []
        )
    );

    return account;
}

export const DEFAULT_TEMP_MEM_SPACE = 65528;

export function createTempMemoryAccount(
    instructions: TransactionInstruction[],
    payer: PublicKey,
    signers: Account[],
    space = DEFAULT_TEMP_MEM_SPACE
) {
    const account = new Account();
    instructions.push(
        SystemProgram.createAccount({
            fromPubkey: payer,
            newAccountPubkey: account.publicKey,
            // 0 will evict/clost account since it cannot pay rent
            lamports: 0,
            space: space,
            programId: TOKEN_PROGRAM_ID,
        })
    );

    signers.push(account);

    return account.publicKey;
}

export function createUninitializedObligation(
    instructions: TransactionInstruction[],
    payer: PublicKey,
    amount: number,
    signers: Account[]
) {
    const account = new Account();
    instructions.push(
        SystemProgram.createAccount({
            fromPubkey: payer,
            newAccountPubkey: account.publicKey,
            lamports: amount,
            space: LendingObligationLayout.span,
            programId: LENDING_PROGRAM_ID,
        })
    );

    signers.push(account);

    return account.publicKey;
}

export function createUninitializedMint(
    instructions: TransactionInstruction[],
    payer: PublicKey,
    amount: number,
    signers: Account[]
) {
    const account = new Account();
    instructions.push(
        SystemProgram.createAccount({
            fromPubkey: payer,
            newAccountPubkey: account.publicKey,
            lamports: amount,
            space: MintLayout.span,
            programId: TOKEN_PROGRAM_ID,
        })
    );

    signers.push(account);

    return account.publicKey;
}

export function createUninitializedAccount(
    instructions: TransactionInstruction[],
    payer: PublicKey,
    amount: number,
    signers: Account[]
) {
    const account = new Account();
    instructions.push(
        SystemProgram.createAccount({
            fromPubkey: payer,
            newAccountPubkey: account.publicKey,
            lamports: amount,
            space: AccountLayout.span,
            programId: TOKEN_PROGRAM_ID,
        })
    );

    signers.push(account);

    return account.publicKey;
}

export function createTokenAccount(
    instructions: TransactionInstruction[],
    payer: PublicKey,
    accountRentExempt: number,
    mint: PublicKey,
    owner: PublicKey,
    signers: Account[]
) {
    console.log('createTokenAccount',createTokenAccount)
    const account = createUninitializedAccount(
        instructions,
        payer,
        accountRentExempt,
        signers
    );

    instructions.push(
        Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, mint, account, owner)
    );

    return account;
}

// TODO: check if one of to accounts needs to be native sol ... if yes unwrap it ...
export function findOrCreateAccountByMint(
    payer: PublicKey,
    owner: PublicKey,
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    accountRentExempt: number,
    mint: PublicKey, // use to identify same type
    signers: Account[],
    excluded?: Set<string>,
    accountsByOwnerParsed?: TokenAccount[]
): PublicKey {
    const accountToFind = mint.toBase58();
    const account = cache
        .byParser(TokenAccountParser)
        .map((id) => cache.get(id))
        .find(
            (acc) =>
                acc !== undefined &&
                acc.info.mint.toBase58() === accountToFind &&
                acc.info.owner.toBase58() === owner.toBase58() &&
                (excluded === undefined || !excluded.has(acc.pubkey.toBase58()))
        );
    const isWrappedSol = accountToFind === WRAPPED_SOL_MINT.toBase58();

    let toAccount: PublicKey;
    if (account && !isWrappedSol) {
        toAccount = account.pubkey;
    } else {
        //find accound from owners parsed

            const acc = accountsByOwnerParsed && accountsByOwnerParsed.find(
                (acc) =>
                    acc !== undefined &&
                    acc.info.mint.toBase58() === accountToFind &&
                    acc.info.owner.toBase58() === owner.toBase58() &&
                    (excluded === undefined || !excluded.has(acc.pubkey.toBase58()))
            )
            console.log('acc', acc);
            toAccount = acc?.pubkey || createTokenAccount(
                instructions,
                payer,
                accountRentExempt,
                mint,
                owner,
                signers
            );

        if (isWrappedSol) {
            cleanupInstructions.push(
                Token.createCloseAccountInstruction(
                    TOKEN_PROGRAM_ID,
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
