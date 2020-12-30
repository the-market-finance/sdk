'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.findOrCreateAccountByMint = exports.createTokenAccount = exports.createUninitializedAccount = exports.createUninitializedMint = exports.createUninitializedObligation = exports.createTempMemoryAccount = exports.DEFAULT_TEMP_MEM_SPACE = exports.ensureSplAccount = void 0;
var spl_token_1 = require('@solana/spl-token');
var web3_js_1 = require('@solana/web3.js');
var ids_1 = require('../constants/ids');
var models_1 = require('../models');
var accountsC_1 = require('../contexts/accountsC');
function ensureSplAccount(instructions, cleanupInstructions, toCheck, payer, amount, signers) {
  if (!toCheck.info.isNative) {
    return toCheck.pubkey;
  }
  var account = createUninitializedAccount(instructions, payer, amount, signers);
  instructions.push(
    spl_token_1.Token.createInitAccountInstruction(ids_1.TOKEN_PROGRAM_ID, ids_1.WRAPPED_SOL_MINT, account, payer),
  );
  cleanupInstructions.push(
    spl_token_1.Token.createCloseAccountInstruction(ids_1.TOKEN_PROGRAM_ID, account, payer, payer, []),
  );
  return account;
}
exports.ensureSplAccount = ensureSplAccount;
exports.DEFAULT_TEMP_MEM_SPACE = 65528;
function createTempMemoryAccount(instructions, payer, signers, space) {
  if (space === void 0) {
    space = exports.DEFAULT_TEMP_MEM_SPACE;
  }
  var account = new web3_js_1.Account();
  instructions.push(
    web3_js_1.SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: account.publicKey,
      // 0 will evict/clost account since it cannot pay rent
      lamports: 0,
      space: space,
      programId: ids_1.TOKEN_PROGRAM_ID,
    }),
  );
  signers.push(account);
  return account.publicKey;
}
exports.createTempMemoryAccount = createTempMemoryAccount;
function createUninitializedObligation(instructions, payer, amount, signers) {
  var account = new web3_js_1.Account();
  instructions.push(
    web3_js_1.SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: account.publicKey,
      lamports: amount,
      space: models_1.LendingObligationLayout.span,
      programId: ids_1.LENDING_PROGRAM_ID,
    }),
  );
  signers.push(account);
  return account.publicKey;
}
exports.createUninitializedObligation = createUninitializedObligation;
function createUninitializedMint(instructions, payer, amount, signers) {
  var account = new web3_js_1.Account();
  instructions.push(
    web3_js_1.SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: account.publicKey,
      lamports: amount,
      space: spl_token_1.MintLayout.span,
      programId: ids_1.TOKEN_PROGRAM_ID,
    }),
  );
  signers.push(account);
  return account.publicKey;
}
exports.createUninitializedMint = createUninitializedMint;
function createUninitializedAccount(instructions, payer, amount, signers) {
  var account = new web3_js_1.Account();
  instructions.push(
    web3_js_1.SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: account.publicKey,
      lamports: amount,
      space: spl_token_1.AccountLayout.span,
      programId: ids_1.TOKEN_PROGRAM_ID,
    }),
  );
  signers.push(account);
  return account.publicKey;
}
exports.createUninitializedAccount = createUninitializedAccount;
function createTokenAccount(instructions, payer, accountRentExempt, mint, owner, signers) {
  var account = createUninitializedAccount(instructions, payer, accountRentExempt, signers);
  instructions.push(spl_token_1.Token.createInitAccountInstruction(ids_1.TOKEN_PROGRAM_ID, mint, account, owner));
  return account;
}
exports.createTokenAccount = createTokenAccount;
// TODO: check if one of to accounts needs to be native sol ... if yes unwrap it ...
function findOrCreateAccountByMint(
  payer,
  owner,
  instructions,
  cleanupInstructions,
  accountRentExempt,
  mint, // use to identify same type
  signers,
  excluded,
) {
  var accountToFind = mint.toBase58();
  var account = accountsC_1.cache
    .byParser(accountsC_1.TokenAccountParser)
    .map(function (id) {
      return accountsC_1.cache.get(id);
    })
    .find(function (acc) {
      return (
        acc !== undefined &&
        acc.info.mint.toBase58() === accountToFind &&
        acc.info.owner.toBase58() === owner.toBase58() &&
        (excluded === undefined || !excluded.has(acc.pubkey.toBase58()))
      );
    });
  var isWrappedSol = accountToFind === ids_1.WRAPPED_SOL_MINT.toBase58();
  var toAccount;
  if (account && !isWrappedSol) {
    toAccount = account.pubkey;
  } else {
    // creating depositor pool account
    toAccount = createTokenAccount(instructions, payer, accountRentExempt, mint, owner, signers);
    if (isWrappedSol) {
      cleanupInstructions.push(
        spl_token_1.Token.createCloseAccountInstruction(ids_1.TOKEN_PROGRAM_ID, toAccount, payer, payer, []),
      );
    }
  }
  return toAccount;
}
exports.findOrCreateAccountByMint = findOrCreateAccountByMint;
