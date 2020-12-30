"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPct = exports.formatNumber = exports.formatUSD = exports.formatTokenAmount = exports.fromLamports = exports.wadToLamports = exports.toLamports = exports.chunks = exports.STABLE_COINS = exports.isKnownMint = exports.getTokenIcon = exports.getTokenName = exports.shortenAddress = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const constants_1 = require("../constants");
// export function useLocalStorageState(key: string, defaultState?: string) {
//   const [state, setState] = useState(() => {
//     // NOTE: Not sure if this is ok
//     const storedState = localStorage.getItem(key);
//     if (storedState) {
//       return JSON.parse(storedState);
//     }
//     return defaultState;
//   });
//
//   const setLocalStorageState = useCallback(
//       (newState) => {
//         const changed = state !== newState;
//         if (!changed) {
//           return;
//         }
//         setState(newState);
//         if (newState === null) {
//           localStorage.removeItem(key);
//         } else {
//           localStorage.setItem(key, JSON.stringify(newState));
//         }
//       },
//       [state, key]
//   );
//
//   return [state, setLocalStorageState];
// }
// shorten the checksummed version of the input address to have 4 characters at start and end
function shortenAddress(address, chars = 4) {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
exports.shortenAddress = shortenAddress;
function getTokenName(map, mint, shorten = true) {
    const mintAddress = typeof mint === 'string' ? mint : mint?.toBase58();
    if (!mintAddress) {
        return 'N/A';
    }
    const knownSymbol = map.get(mintAddress)?.tokenSymbol;
    if (knownSymbol) {
        return knownSymbol;
    }
    return shorten ? `${mintAddress.substring(0, 5)}...` : mintAddress;
}
exports.getTokenName = getTokenName;
function getTokenIcon(map, mintAddress) {
    const address = typeof mintAddress === 'string' ? mintAddress : mintAddress?.toBase58();
    if (!address) {
        return;
    }
    return map.get(address)?.icon;
}
exports.getTokenIcon = getTokenIcon;
function isKnownMint(map, mintAddress) {
    return !!map.get(mintAddress);
}
exports.isKnownMint = isKnownMint;
exports.STABLE_COINS = new Set(['USDC', 'wUSDC', 'USDT']);
function chunks(array, size) {
    return Array.apply(0, new Array(Math.ceil(array.length / size))).map((_, index) => array.slice(index * size, (index + 1) * size));
}
exports.chunks = chunks;
function toLamports(account, mint) {
    if (!account) {
        return 0;
    }
    const amount = typeof account === 'number' ? account : account.info.amount?.toNumber();
    const precision = Math.pow(10, mint?.decimals || 0);
    return Math.floor(amount * precision);
}
exports.toLamports = toLamports;
function wadToLamports(amount) {
    return amount?.div(constants_1.WAD) || constants_1.ZERO;
}
exports.wadToLamports = wadToLamports;
function fromLamports(account, mint, rate = 1.0) {
    if (!account) {
        return 0;
    }
    const amount = Math.floor(typeof account === 'number' ? account : bn_js_1.default.isBN(account) ? account.toNumber() : account.info.amount.toNumber());
    const precision = Math.pow(10, mint?.decimals || 0);
    return (amount / precision) * rate;
}
exports.fromLamports = fromLamports;
var SI_SYMBOL = ['', 'k', 'M', 'G', 'T', 'P', 'E'];
const abbreviateNumber = (number, precision) => {
    let tier = (Math.log10(number) / 3) | 0;
    let scaled = number;
    let suffix = SI_SYMBOL[tier];
    if (tier !== 0) {
        let scale = Math.pow(10, tier * 3);
        scaled = number / scale;
    }
    return scaled.toFixed(precision) + suffix;
};
const format = (val, precision, abbr) => abbr ? abbreviateNumber(val, precision) : val.toFixed(precision);
function formatTokenAmount(account, mint, rate = 1.0, prefix = '', suffix = '', precision = 6, abbr = false) {
    if (!account) {
        return '';
    }
    return `${[prefix]}${format(fromLamports(account, mint, rate), precision, abbr)}${suffix}`;
}
exports.formatTokenAmount = formatTokenAmount;
exports.formatUSD = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});
const numberFormater = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});
exports.formatNumber = {
    format: (val) => {
        if (!val) {
            return '--';
        }
        return numberFormater.format(val);
    },
};
exports.formatPct = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});
