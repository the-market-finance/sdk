'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.programIds = exports.setProgramIds = exports.LENDING_PROGRAM_ID = exports.TOKEN_PROGRAM_ID = exports.WRAPPED_SOL_MINT = void 0;
var web3_js_1 = require('@solana/web3.js');
exports.WRAPPED_SOL_MINT = new web3_js_1.PublicKey('So11111111111111111111111111111111111111112');
exports.TOKEN_PROGRAM_ID = new web3_js_1.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
exports.LENDING_PROGRAM_ID = new web3_js_1.PublicKey('TokenLend1ng1111111111111111111111111111111');
var setProgramIds = function (envName) {
  // Add dynamic program ids
  if (envName === 'mainnet-beta') {
    /*LENDING_PROGRAM_ID = new PublicKey(
          "8jxiwt9YdcWz5LwS2Ywabyj3S52NSNBQ56UBbCoJa8U6"
        );*/
    // 3kT9ai52KnPzU1aNy9rFVrpeZGRyNkhjaNC3nzrDL4bz
    exports.LENDING_PROGRAM_ID = new web3_js_1.PublicKey('FEgTndbNvdWKtXYaNnZQ9RD7EwzFy3AEhpkNbdRzFotF');
  }
  if (envName === 'devnet') {
    exports.LENDING_PROGRAM_ID = new web3_js_1.PublicKey('h3rbY3rj7ktSADKpnbH6NrPFNZaBuaadzzVhctAAzXe');
  }
};
exports.setProgramIds = setProgramIds;
var programIds = function () {
  return {
    token: exports.TOKEN_PROGRAM_ID,
    lending: exports.LENDING_PROGRAM_ID,
  };
};
exports.programIds = programIds;
