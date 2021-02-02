This library is designed to work with The Market Finance protocol.

## Functions

- deposit, borrow, withdraw, repay - operations of deposit, borrow, withdraw and repay
- getReserveAccounts - get parsed tokens for operations (deposit, borrow)
- getUserObligations - get obligations with a user account, for operations (borrow repayment)
- getUserDeposit - get parsed tokens for operations (deposit, withdraw)
- getBorrowApy, borrowApyVal - information request displaying the current APY loan rate
- availableForBorrow - information request displaying how much you can borrow
- getDepositApy, depositApyVal - information request displaying the current rate on the APY deposit

Many functions take arguments such as wallet instances, connections from libraries:

- @solana/web3.js 
- @project-serum/sol-wallet-adapter


## Install

```bash
npm install tmf-sdk
```
## Import

```jsx
import 
    {deposit, borrow, repay, withdraw, getReserveAccounts,
     getUserObligations, getUserDeposit, getBorrowApy,
     borrowApyVal, availableForBorrow, getDepositApy, depositApyVal,
    getEnrichedLendingObligations, calculateDependent, swap, liquidate} from 'tmf-sdk';
```

## Description

```jsx
/**
 * Get parsed tokens for operations (deposit, borrow)
 *
 * @param connection: Connection
 * (optional, passed to get one account at this address, an array of 1 elements)
 * @param address?: string | PublicKey
 * @return Promise<ParsedAccount<LendingReserve>[]>
 * @async
 */
export const getReserveAccounts = async (
    connection: Connection,
    address?: string | PublicKey
):Promise<ParsedAccount<LendingReserve>[]> => {...}

/**
 * Get parsed tokens for operations (deposit, withdraw)
 *
 * @param connection: Connection
 * @param wallet: Wallet
 * (optional, passed to get one account at this address, an array of 1 elements)
 * @param address?: string | PublicKey
 * @return Promise<ParsedAccount<TokenAccount>[]>
 * @async
 */
export const getUserDeposit = async (
    connection: Connection,
    wallet: any,
    address?: string | PublicKey
) => {...}

/**
 * Get obligations with a user account, for operations (borrow repayment)
 *
 * @param connection: Connection
 * @param wallet: Wallet
 * (optional, passed to get one account at this address, an array of 1 elements)
 * @param address?: string | PublicKey
 * @return Promise<{obligation:any, userAccounts:any}[]>
 * @async
 */
export const getUserObligations = async (
    connection: Connection,
    wallet: any,
    address?: string | PublicKey
) => {...}

/**
 * information request displaying the current rate on the APY deposit
 *
 * @param connection: Connection
 * @param publicKey: string | PublicKey (token address)
 * @return Promise<string>
 * @async
 */
export const getDepositApy = async (
    connection: Connection,
    publicKey: string | PublicKey
):Promise<string> => {...}

/**
 * information request displaying the current rate on the APY borrow
 *
 * @param connection: Connection
 * @param publicKey: string | PublicKey (token address)
 * @return Promise<string>
 * @async
 */
export const getBorrowApy = async (
    connection: Connection,
    publicKey: string | PublicKey
): Promise<string> => {...}

/**
 * information request displaying the current rate on the APY deposit
 *
 * @param reserve: LendingReserve (can be obtained via getReserveAccounts)
 * @return string
 */
export const depositApyVal = (reserve: LendingReserve):string => {...}

/**
 * creation of a deposit (deposit)
 *
 * @param value: string
 * @param reserve: LendingReserve (can be obtained through getReserveAccounts(connection, address)[0].info)
 * @param reserveAddress: PublicKey (can be obtained through getReserveAccounts(connection, address)[0].pubkey)
 * @param connection: Connection
 * @param wallet: Wallet
 * @param notifyCallback?: (message:object) => void | any (e.g. the notify function from antd)
 * @return void
 * @async
 */
export const deposit = async (
    value: string,
    reserve: LendingReserve,
    reserveAddress: PublicKey,
    connection: Connection,
    wallet: any,
    notifyCallback?: (message:object) => void | any
) => {...}

/**
 * information request displaying the current rate on the APY borrow
 *
 * @param reserve: LendingReserve (can be obtained via getReserveAccounts)
 * @return string
 */
export const borrowApyVal = (reserve: LendingReserve): string => {...}

/**
 * information request displaying how much you can borrow
 *
 * @param connection: Connection
 * @param wallet: Wallet
 * @param publicKey: string | PublicKey (token address)
 * @return Promise<string>
 * @async
 */
export const availableForBorrow = async (
    connection: Connection,
    wallet: any,
    publicKey: string | PublicKey
): Promise<string> => {...}

/**
 * creating a borrow (borrow)
 *
 * @param connection: Connection
 * @param wallet: Wallet
 * @param amount: number (borrow amount as Float)
 * @param collateralAddress: PublicKey | string (address or PublicKey of the token for collateral)
 * @param borrowReserve: ParsedAccount<LendingReserve> (can be obtained through getReserveAccounts(connection, address)[0]))
 * @param notifyCallback?: (message:object) => void | any (e.g. the notify function from antd)
 * @return void
 * @async
 */
export const borrow = async (
    connection: Connection,
    wallet: any,
    amount: number,
    collateralAddress: PublicKey | string,
    borrowReserve: ParsedAccount<LendingReserve>,
    notifyCallback?: (message: object) => void | any
): Promise<void> => {...}


/**
 * withdrawal of funds from the deposit (withdraw)
 *
 * @param value: string  (amount)
 * @param reserve: LendingReserve (can be obtained through getReserveAccounts(connection, address)[0].info)
 * @param reserveAddress: PublicKey (can be obtained through getReserveAccounts(connection, address)[0].pubkey)
 * @param connection: Connection
 * @param wallet: Wallet
 * @param notifyCallback?: (message:object) => void | any (e.g. the notify function from antd)
 * @return void
 * @async
 */
export const withdraw = async (
    value: string,
    reserve: LendingReserve,
    reserveAddress: PublicKey,
    connection: Connection,
    wallet: any,
    notifyCallback?: (message: object) => void | any
) => {...}


/**
 * repayment of the borrow (repay)
 *
 * @param value: string (amount)
 * @param obligationAddress: PublicKey | string (token address borrow repayment)
 * @param collateralAddress: PublicKey | string (collateral token address)
 * @param connection: Connection
 * @param wallet: Wallet
 * @param notifyCallback?: (message:object) => void | any (e.g. the notify function from antd)
 * @return void
 * @async
 */
export const repay = async (
    value: string, // (amount)
    obligationAddress:PublicKey | string, // (token address borrow repayment)
    collateralAddress: PublicKey | string,// (collateral token address)
    connection: Connection,
    wallet: any,
    notifyCallback?: (message: object) => void | any
) => {...}

/**
 * Get obligations with a user account, for operations (liquidate)
 *
 * @param connection: Connection
 * @param wallet: Wallet
 * (optional, passed to get one account at this address, an array of 1 elements)
 * @param address?: string | PublicKey
 * @return Promise<EnrichedLendingObligation[]>
 * @async
 */
export const getEnrichedLendingObligations = async (
    connection: Connection,
    wallet: any, address?: string | PublicKey
) => {...}

/**
 * liquidate user obligation
 *
 * @param connection: Connection
 * @param wallet: Wallet
 * @param obligation: EnrichedLendingObligation
 * @param notifyCallback?: (message:object) => void | any (e.g. the notify function from antd)
 * @return void
 * @async
 */
export const liquidate = async (
    connection: Connection,
    wallet: any,
    obligation: EnrichedLendingObligation,
    notifyCallback?: (message: object) => void | any
) => {...}

/**
 * swap of tokens
 *
 * @param connection: Connection
 * @param wallet: Wallet
 * 
 * interface SwapArgs {
 *      mintAddressA: string,
 *      amountA: string,
 *      mintAddressB: string,
 *      amountB: string 
 * }
 * @param swapArgs: interface SwapArgs
 * @param notifyCallback?: (message:object) => void | any (e.g. the notify function from antd)
 * @param slippage?: number
 * @return void
 * @async
 */
export const swap = async (
connection: Connection,
wallet: any,
swapArgs: SwapArgs,
notifyCallback?: (message:object) => void | any,
slippage?: number
) => {...}

/**
 * information request calculates dependence max amount tokens "B" on amount tokens "A" for swap
 *
 * @param connection: Connection
 *
 * interface SwapArgs {
 *      mintAddressA: string,
 *      amountA: string,
 *      mintAddressB: string
 * }
 * @param swapArgs: interface SwapArgs
 * @return Promise<string> (amountB: string)
 * @async
 */
export const calculateDependent = async (
    connection: Connection
    swapArgs: SwapArgs
): Promise<string> => {..}
```

## Examples of using

```jsx
import 
    {deposit, borrow, repay, withdraw, getReserveAccounts,
     getUserObligations, getUserDeposit, getBorrowApy,
     borrowApyVal, availableForBorrow, getDepositApy, depositApyVal} from 'tmf-sdk';

const value = '0.5' // deposit amount
const callback = (msg) => console.log(msg) // notify function for displaying information about the process 
const connection = new Connection("https://solana-api.projectserum.com", "recent");
const wallet = new Wallet(...args);
// token id for the operation
const id = new PublicKey('87zx7zvUhptEFhatCcdcFsdFZsv5tx3CdyTXxv2ms5CK') || '87zx7zvUhptEFhatCcdcFsdFZsv5tx3CdyTXxv2ms5CK';
// collateral token
const collateralKey = new PublicKey('87zx7zvUhptEFhatCcdcFsdFZsv5tx3CdyTXxv2ms5CK') || '87zx7zvUhptEFhatCcdcFsdFZsv5tx3CdyTXxv2ms5CK';

// DEPOSIT 

async function deposit_example_1() {
    const reserveAccounts = await getReserveAccounts(connection);
    reserveAccounts.map(async (account, index) => {
        const reserve = account.info;
        const address = account.pubkey;
        await deposit(value, reserve, address, connection, wallet, callback)
    });
};

async function deposit_example_2() {
    const lendingReserve = await getReserveAccounts(connection, id);
    if (lendingReserve.length) {
        await deposit(value, lendingReserve[0].info, lendingReserve[0].pubkey, connection, wallet, callback)
    }
}

// WITHDRAW

async function withdraw_example_1() {
    const userDeposits = await getUserDeposit(connection, wallet);
    userDeposits.map(async (deposit, index) => {
        const reserveAcc = await await getReserveAccounts(connection, deposit.reserve.pubkey);
        await withdraw(value, reserveAcc.info, reserveAcc.pubkey, connection, wallet, callback)
    });
};

async function withdraw_example_2() {
    const lendingReserve = await getReserveAccounts(connection, id);
    if (lendingReserve.length) {
        await withdraw(value, lendingReserve.info, lendingReserve.pubkey, connection, wallet, callback)
    }
}

// BORROW

async function borrow_example_1() {
    const reserveAccounts = await getReserveAccounts(connection);
    reserveAccounts.map(async (account, index) => {
        const borrowReserve = account
        await borrow(connection, wallet, parseFloat(value), collateralKey, borrowReserve, callback)
    });
};

async function borrow_example_2() {
    const lendingReserve = await getReserveAccounts(connection, id);
    if (lendingReserve.length) {
        const borrowReserve = lendingReserve[0]
        await borrow(connection, wallet, parseFloat(value), collateralKey, borrowReserve, callback)
    }
}

// REPAY

async function repay_example_1() {
    const userObligations = await getUserObligations(connection, wallet);
    userObligations.map(async (item, index) => {
        await repay(value, item.obligation.pubkey, collateralKey, connection, wallet, callback)
    });
};

async function repay_example_2() {
    const lendingReserve = await getReserveAccounts(connection, id);
    if (lendingReserve.length) {
        await repay(value, lendingReserve.pubkey, collateralKey, connection, wallet, callback)
    }  
};

// LIQUIDATE

async function liquidate_example_1() {
    const obligations = await getEnrichedLendingObligations(connection, wallet);
    obligations.map(async (obligation) => {
        await liquidate(connection, wallet, obligation, callback)
    });
};

async function liquidate_example_2() {
    const obligationById = await getEnrichedLendingObligations(connection, wallet, id);
    if (obligationById.length) {
        await liquidate(connection, wallet, obligationById[0], callback)
    }  
};

//SWAP

const swapArgs = {
    amountA: "1",
    mintAddressA: "So11111111111111111111111111111111111111112",
    mintAddressB: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
}

async function swap_example() {
    const amountB = await calculateDependent(connection, swapArgs);
    await swap(connection, wallet, {...swapArgs, amountB}, callback);
};








```