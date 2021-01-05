import { PublicKey } from '@solana/web3.js';

export const WRAPPED_SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
export let TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

export let LENDING_PROGRAM_ID = new PublicKey('FEgTndbNvdWKtXYaNnZQ9RD7EwzFy3AEhpkNbdRzFotF');

export const programIds = () => {
  return {
    token: TOKEN_PROGRAM_ID,
    lending: LENDING_PROGRAM_ID,
  };
};
