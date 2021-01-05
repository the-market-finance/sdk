import { AccountLayout, MintLayout, Token } from '@solana/spl-token';
import { Account, SystemProgram } from '@solana/web3.js';
import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID, WRAPPED_SOL_MINT } from '../constants/ids';
import { LendingObligationLayout } from '../models';
import { cache, TokenAccountParser } from '../contexts/accountsC';
export function ensureSplAccount(instructions, cleanupInstructions, toCheck, payer, amount, signers) {
    if (!toCheck.info.isNative) {
        return toCheck.pubkey;
    }
    var account = createUninitializedAccount(instructions, payer, amount, signers);
    instructions.push(Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, WRAPPED_SOL_MINT, account, payer));
    cleanupInstructions.push(Token.createCloseAccountInstruction(TOKEN_PROGRAM_ID, account, payer, payer, []));
    return account;
}
export var DEFAULT_TEMP_MEM_SPACE = 65528;
export function createTempMemoryAccount(instructions, payer, signers, space) {
    if (space === void 0) { space = DEFAULT_TEMP_MEM_SPACE; }
    var account = new Account();
    instructions.push(SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: account.publicKey,
        // 0 will evict/clost account since it cannot pay rent
        lamports: 0,
        space: space,
        programId: TOKEN_PROGRAM_ID,
    }));
    signers.push(account);
    return account.publicKey;
}
export function createUninitializedObligation(instructions, payer, amount, signers) {
    var account = new Account();
    instructions.push(SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: account.publicKey,
        lamports: amount,
        space: LendingObligationLayout.span,
        programId: LENDING_PROGRAM_ID,
    }));
    signers.push(account);
    return account.publicKey;
}
export function createUninitializedMint(instructions, payer, amount, signers) {
    var account = new Account();
    instructions.push(SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: account.publicKey,
        lamports: amount,
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID,
    }));
    signers.push(account);
    return account.publicKey;
}
export function createUninitializedAccount(instructions, payer, amount, signers) {
    var account = new Account();
    instructions.push(SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: account.publicKey,
        lamports: amount,
        space: AccountLayout.span,
        programId: TOKEN_PROGRAM_ID,
    }));
    signers.push(account);
    return account.publicKey;
}
export function createTokenAccount(instructions, payer, accountRentExempt, mint, owner, signers) {
    var account = createUninitializedAccount(instructions, payer, accountRentExempt, signers);
    instructions.push(Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, mint, account, owner));
    return account;
}
// TODO: check if one of to accounts needs to be native sol ... if yes unwrap it ...
export function findOrCreateAccountByMint(payer, owner, instructions, cleanupInstructions, accountRentExempt, mint, // use to identify same type
signers, excluded) {
    var accountToFind = mint.toBase58();
    var account = cache
        .byParser(TokenAccountParser)
        .map(function (id) { return cache.get(id); })
        .find(function (acc) {
        return acc !== undefined &&
            acc.info.mint.toBase58() === accountToFind &&
            acc.info.owner.toBase58() === owner.toBase58() &&
            (excluded === undefined || !excluded.has(acc.pubkey.toBase58()));
    });
    var isWrappedSol = accountToFind === WRAPPED_SOL_MINT.toBase58();
    var toAccount;
    if (account && !isWrappedSol) {
        toAccount = account.pubkey;
    }
    else {
        // creating depositor pool account
        toAccount = createTokenAccount(instructions, payer, accountRentExempt, mint, owner, signers);
        if (isWrappedSol) {
            cleanupInstructions.push(Token.createCloseAccountInstruction(TOKEN_PROGRAM_ID, toAccount, payer, payer, []));
        }
    }
    return toAccount;
}
