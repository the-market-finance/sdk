"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deposit = void 0;
const web3_js_1 = require("@solana/web3.js");
const lending_1 = require("./../models/lending");
const spl_token_1 = require("@solana/spl-token");
const ids_1 = require("../constants/ids");
const account_1 = require("./account");
const connection_1 = require("../contexts/connection");
const deposit = async (from, amountLamports, reserve, reserveAddress, connection, wallet) => {
    // notify({
    //     message: "Depositing funds...",
    //     description: "Please review transactions to approve.",
    //     type: "warn",
    // });
    const isInitalized = true; // TODO: finish reserve init
    // user from account
    const signers = [];
    const instructions = [];
    const cleanupInstructions = [];
    const accountRentExempt = await connection.getMinimumBalanceForRentExemption(spl_token_1.AccountLayout.span);
    const [authority] = await web3_js_1.PublicKey.findProgramAddress([reserve.lendingMarket.toBuffer()], // which account should be authority
    ids_1.LENDING_PROGRAM_ID);
    const fromAccount = account_1.ensureSplAccount(instructions, cleanupInstructions, from, wallet.publicKey, amountLamports + accountRentExempt, signers);
    // create approval for transfer transactions
    instructions.push(spl_token_1.Token.createApproveInstruction(ids_1.TOKEN_PROGRAM_ID, fromAccount, authority, wallet.publicKey, [], amountLamports));
    let toAccount;
    if (isInitalized) {
        // get destination account
        toAccount = await account_1.findOrCreateAccountByMint(wallet.publicKey, wallet.publicKey, instructions, cleanupInstructions, accountRentExempt, reserve.collateralMint, signers);
    }
    else {
        toAccount = account_1.createUninitializedAccount(instructions, wallet.publicKey, accountRentExempt, signers);
    }
    if (isInitalized) {
        // deposit
        instructions.push(lending_1.depositInstruction(amountLamports, fromAccount, toAccount, authority, reserveAddress, reserve.liquiditySupply, reserve.collateralMint));
    }
    else {
        // TODO: finish reserve init
        const MAX_UTILIZATION_RATE = 80;
        instructions.push(lending_1.initReserveInstruction(amountLamports, MAX_UTILIZATION_RATE, fromAccount, toAccount, reserveAddress, reserve.liquidityMint, reserve.liquiditySupply, reserve.collateralMint, reserve.collateralSupply, reserve.lendingMarket, authority, reserve.dexMarket));
    }
    try {
        let tx = await connection_1.sendTransaction(connection, wallet, instructions.concat(cleanupInstructions), signers, true);
        return {
            message: 'Funds deposited.',
            type: 'success',
            description: `Transaction - ${tx.slice(0, 7)}...${tx.slice(-7)}`,
        };
    }
    catch {
        // TODO:
        throw new Error();
    }
};
exports.deposit = deposit;
