import { Token } from '@solana/spl-token';
import { TOKEN_PROGRAM_ID } from '../constants';
export function approve(instructions, cleanupInstructions, account, delegate, owner, amount) {
    var tokenProgram = TOKEN_PROGRAM_ID;
    instructions.push(Token.createApproveInstruction(tokenProgram, account, delegate, owner, [], amount));
    cleanupInstructions.push(Token.createRevokeInstruction(tokenProgram, account, owner, []));
}
