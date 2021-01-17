## ⚠️ Докуменация

Данный пакет предназначен для соверешения операций через Solana блокчейн.

## ✨️ Проверенные функции:
     
- Получение распарсенных токенов по лендингу, для дальнейших оперций(депозит,займ) - getReserveAccounts.
- Получение облигаций с аккаунтом пользователя , для операций (погашение займа) - getUserObligations.
- Получение распарсенных токенов по лендингу, для операций (депозит, снятие) - getUserDeposit.
- Операции депозит, заём, снятие, погашение - deposit, borrow, withdraw, repay.
- Информационный запрос, выводящий текущую ставку по кредиту APY - (getBorrowApy,borrowApyVal).
- Информационный запрос, выводящий сколько можно занять в долг - availableForBorrow.
- информационный запрос, выводящий текущую ставку по депозиту APY - (getDepositApy,depositApyVal)

⚠
Многие функции принимают аргументы такие как инстансы wallet, connection из библиотек(@solana/web3.js,@project-serum/sol-wallet-adapter)
⚠

## 📦 Установка

```bash
npm install tmf-sdk
```
## 🔨 Использование(получение)
```jsx
import 
    {deposit, borrow, repay, withdraw,
    getReserveAccounts, getUserObligations, getUserDeposit,
    getBorrowApy, borrowApyVal, availableForBorrow, getDepositApy, depositApyVal} from 'tmf-sdk';
```

## 🖥 Инфа по функциям

```jsx
/**
 * Получение аккаунтов по лендингу для операций deposit, borrow.
 *
 * @param connection:Connection
 * (необязательный, передаётся для получение одного аккаунта по этому адрессу, тоесть массив из 1 елемента)
 * @param address?: string | PublicKey
 * @return  Promise<ParsedAccount<LendingReserve>[]>
 * @async
 */
export const getReserveAccounts = async (connection: Connection, address?: string | PublicKey):Promise<ParsedAccount<LendingReserve>[]> => {...}

/**
 * Получение распарсенных токенов по лендингу, для операций (deposit, withdraw)
 *
 * @param connection:Connection
 * @param wallet: Wallet
 * @return  Promise<ParsedAccount<TokenAccount>[]>
 * @async
 */
export const getUserDeposit = async (connection: Connection, wallet:any) => {...}

/**
 * Получение облигаций с аккаунтом пользователя , для операций repay
 *
 * @param connection:Connection
 * @param wallet: Wallet
 * (необязательный, передаётся для получение одного аккаунта по этому адрессу, тоесть массив из 1 елемента)
 * @param address?: string | PublicKey
 * @return  Promise<{obligation:any, userAccounts:any}[]>
 * @async
 */
export const getUserObligations = async (connection: Connection, wallet:any,address?: string | PublicKey) => {...}

/**
 * информационный запрос, выводящий текущую ставку по депозиту APY
 *
 * @param connection:Connection
 * @param publicKey: string | PublicKey (адресс токена)
 * @return  Promise<string>
 * @async
 */
export const getDepositApy = async (connection: Connection, publicKey: string | PublicKey):Promise<string> => {...}

/**
 * информационный запрос, выводящий текущую ставку по депозиту APY
 *
 * @param reserve:LendingReserve (можно получить через getReserveAccounts)
 * @return  string
 */
export const depositApyVal = (reserve: LendingReserve):string => {...}

/**
 * создание депозита (deposit)
 *
 * @param value:string
 * @param reserve:LendingReserve (можно получить через getReserveAccounts(connection, address)[0].info)
 * @param reserveAddress:PublicKey (можно получить через getReserveAccounts(connection, address)[0].pubkey)
 * @param connection: Connection
 * @param wallet:Wallet
 * @param notifyCallback?: (message:object) => void | any (например функция notify из antd)
 * @return  void
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
 * информационный запрос, выводящий сколько можно занять в долг
 *
 * @param connection: Connection
 * @param wallet:Wallet
 * @param publicKey:string | PublicKey (адресс токена)
 * @return  Promise<string>
 * @async
 */
export const availableForBorrow = async (connection: Connection, wallet: any, publicKey: string | PublicKey): Promise<string> => {...}

/**
 * создание заявки на кредит (borrow)
 *
 * @param connection:Connection
 * @param wallet:Wallet
 * @param amount:number  (сумма займа как Float)
 * @param collateralAddress: PublicKey | string (адресс или PublicKey токена для залога)
 * @param borrowReserve: ParsedAccount<LendingReserve> (можно получить через getReserveAccounts(connection, address)[0]))
 * @param notifyCallback?: (message:object) => void | any (например функция notify из antd)
 * @return  void
 * @async
 */
export const borrow = async (
    connection: Connection,
    wallet: any,
    amount: number,
    collateralAddress: PublicKey | string,
    borrowReserve: ParsedAccount<LendingReserve>,
    notifyCallback?: (message: object) => void | any
) => {...}

```

## ⌨️ Примеры использования
```jsx
// для депозита

import {getReserveAccounts,deposit, borrow} from 'tmf-sdk';


const value = '0.5' // значение какое кладём на депозит
const callback = (msg) => console.log(msg) // функция notify Для вывода информации о процессе 
const connection = new Connection();
const wallet = new Wallet();

async function test(){
    const reserveAccounts = await getReserveAccounts(connection);
    reserveAccounts.map(async (account, index) => {
        const reserve = account.info;
        const address = account.pubkey;
        await deposit(value, reserve, address, connection, wallet, callback)
    });
};
// или 
// id токена для операции
const id = new PublicKey('87zx7zvUhptEFhatCcdcFsdFZsv5tx3CdyTXxv2ms5CK') || '87zx7zvUhptEFhatCcdcFsdFZsv5tx3CdyTXxv2ms5CK';

async function test2(){
        const lendingReserve = await getReserveAccounts(connection, id);
        if (lendingReserve.length){
            await deposit(value, lendingReserve[0].info, lendingReserve[0].pubkey, connection, wallet, callback)
        }         
        
    }
// для borrow

// токен для залога
const collateralKey = new PublicKey('87zx7zvUhptEFhatCcdcFsdFZsv5tx3CdyTXxv2ms5CK') || '87zx7zvUhptEFhatCcdcFsdFZsv5tx3CdyTXxv2ms5CK';
async function test(){
    const reserveAccounts = await getReserveAccounts(connection);
    reserveAccounts.map(async (account, index) => {
        const borrowReserve = account
        await borrow(connection, wallet, parseFloat(value), collateralKey, borrowReserve, callback)
    });
};

async function test2(){
        const lendingReserve = await getReserveAccounts(connection, id);
        if (lendingReserve.length){
            const borrowReserve = lendingReserve[0]
            await borrow(connection, wallet, parseFloat(value), collateralKey, borrowReserve, callback)
        }         
        
    }
```