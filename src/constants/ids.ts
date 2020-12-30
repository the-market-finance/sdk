import { PublicKey } from '@solana/web3.js';

export const WRAPPED_SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
export let TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

export let LENDING_PROGRAM_ID = new PublicKey('TokenLend1ng1111111111111111111111111111111');

export const setProgramIds = (envName: string) => {
  // Add dynamic program ids
  if (envName === 'mainnet-beta') {
    /*LENDING_PROGRAM_ID = new PublicKey(
      "8jxiwt9YdcWz5LwS2Ywabyj3S52NSNBQ56UBbCoJa8U6"
    );*/
    // 3kT9ai52KnPzU1aNy9rFVrpeZGRyNkhjaNC3nzrDL4bz
    LENDING_PROGRAM_ID = new PublicKey('FEgTndbNvdWKtXYaNnZQ9RD7EwzFy3AEhpkNbdRzFotF');
  }
  if (envName === 'devnet') {
    LENDING_PROGRAM_ID = new PublicKey('h3rbY3rj7ktSADKpnbH6NrPFNZaBuaadzzVhctAAzXe');
  }
};

export const programIds = () => {
  return {
    token: TOKEN_PROGRAM_ID,
    lending: LENDING_PROGRAM_ID,
  };
};
