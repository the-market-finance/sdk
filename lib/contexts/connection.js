"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTransaction = exports.ENDPOINTS = void 0;
const web3_js_1 = require("@solana/web3.js");
exports.ENDPOINTS = [
    {
        name: 'mainnet-beta',
        endpoint: 'https://solana-api.projectserum.com/',
    },
    {
        name: 'lending',
        endpoint: 'https://tln.solana.com',
    },
    { name: 'testnet', endpoint: web3_js_1.clusterApiUrl('testnet') },
    { name: 'devnet', endpoint: web3_js_1.clusterApiUrl('devnet') },
    { name: 'localnet', endpoint: 'http://127.0.0.1:8899' },
];
const DEFAULT = exports.ENDPOINTS[0].endpoint;
const DEFAULT_SLIPPAGE = 0.25;
const getErrorForTransaction = async (connection, txid) => {
    // wait for all confirmation before geting transaction
    await connection.confirmTransaction(txid, 'max');
    const tx = await connection.getParsedConfirmedTransaction(txid);
    const errors = [];
    if (tx?.meta && tx.meta.logMessages) {
        tx.meta.logMessages.forEach((log) => {
            const regex = /Error: (.*)/gm;
            let m;
            while ((m = regex.exec(log)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
                if (m.length > 1) {
                    errors.push(m[1]);
                }
            }
        });
    }
    return errors;
};
const sendTransaction = async (connection, wallet, instructions, signers, awaitConfirmation = true) => {
    let transaction = new web3_js_1.Transaction();
    instructions.forEach((instruction) => transaction.add(instruction));
    transaction.recentBlockhash = (await connection.getRecentBlockhash('max')).blockhash;
    transaction.setSigners(
    // fee payied by the wallet owner
    wallet.publicKey, ...signers.map((s) => s.publicKey));
    if (signers.length > 0) {
        transaction.partialSign(...signers);
    }
    transaction = await wallet.signTransaction(transaction);
    const rawTransaction = transaction.serialize();
    let options = {
        skipPreflight: true,
        commitment: 'singleGossip',
    };
    const txid = await connection.sendRawTransaction(rawTransaction, options);
    if (awaitConfirmation) {
        const status = (await connection.confirmTransaction(txid, options && options.commitment)).value;
        if (status?.err) {
            const errors = await getErrorForTransaction(connection, txid);
            throw new Error(`Raw transaction ${txid} failed (${JSON.stringify(status)})`);
        }
    }
    return txid;
};
exports.sendTransaction = sendTransaction;
