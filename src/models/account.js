'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.approve = void 0;
var spl_token_1 = require('@solana/spl-token');
var constants_1 = require('../constants');
function approve(instructions, cleanupInstructions, account, delegate, owner, amount) {
  var tokenProgram = constants_1.TOKEN_PROGRAM_ID;
  instructions.push(spl_token_1.Token.createApproveInstruction(tokenProgram, account, delegate, owner, [], amount));
  cleanupInstructions.push(spl_token_1.Token.createRevokeInstruction(tokenProgram, account, owner, []));
}
exports.approve = approve;
