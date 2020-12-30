'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.formatPct = exports.formatNumber = exports.formatUSD = exports.formatTokenAmount = exports.fromLamports = exports.wadToLamports = exports.toLamports = exports.chunks = exports.STABLE_COINS = exports.isKnownMint = exports.getTokenIcon = exports.getTokenName = exports.shortenAddress = void 0;
var bn_js_1 = __importDefault(require('bn.js'));
var constants_1 = require('../constants');
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
function shortenAddress(address, chars) {
  if (chars === void 0) {
    chars = 4;
  }
  return address.slice(0, chars) + '...' + address.slice(-chars);
}
exports.shortenAddress = shortenAddress;
function getTokenName(map, mint, shorten) {
  var _a;
  if (shorten === void 0) {
    shorten = true;
  }
  var mintAddress = typeof mint === 'string' ? mint : mint === null || mint === void 0 ? void 0 : mint.toBase58();
  if (!mintAddress) {
    return 'N/A';
  }
  var knownSymbol = (_a = map.get(mintAddress)) === null || _a === void 0 ? void 0 : _a.tokenSymbol;
  if (knownSymbol) {
    return knownSymbol;
  }
  return shorten ? mintAddress.substring(0, 5) + '...' : mintAddress;
}
exports.getTokenName = getTokenName;
function getTokenIcon(map, mintAddress) {
  var _a;
  var address =
    typeof mintAddress === 'string'
      ? mintAddress
      : mintAddress === null || mintAddress === void 0
      ? void 0
      : mintAddress.toBase58();
  if (!address) {
    return;
  }
  return (_a = map.get(address)) === null || _a === void 0 ? void 0 : _a.icon;
}
exports.getTokenIcon = getTokenIcon;
function isKnownMint(map, mintAddress) {
  return !!map.get(mintAddress);
}
exports.isKnownMint = isKnownMint;
exports.STABLE_COINS = new Set(['USDC', 'wUSDC', 'USDT']);
function chunks(array, size) {
  return Array.apply(0, new Array(Math.ceil(array.length / size))).map(function (_, index) {
    return array.slice(index * size, (index + 1) * size);
  });
}
exports.chunks = chunks;
function toLamports(account, mint) {
  var _a;
  if (!account) {
    return 0;
  }
  var amount =
    typeof account === 'number'
      ? account
      : (_a = account.info.amount) === null || _a === void 0
      ? void 0
      : _a.toNumber();
  var precision = Math.pow(10, (mint === null || mint === void 0 ? void 0 : mint.decimals) || 0);
  return Math.floor(amount * precision);
}
exports.toLamports = toLamports;
function wadToLamports(amount) {
  return (amount === null || amount === void 0 ? void 0 : amount.div(constants_1.WAD)) || constants_1.ZERO;
}
exports.wadToLamports = wadToLamports;
function fromLamports(account, mint, rate) {
  if (rate === void 0) {
    rate = 1.0;
  }
  if (!account) {
    return 0;
  }
  var amount = Math.floor(
    typeof account === 'number'
      ? account
      : bn_js_1.default.isBN(account)
      ? account.toNumber()
      : account.info.amount.toNumber(),
  );
  var precision = Math.pow(10, (mint === null || mint === void 0 ? void 0 : mint.decimals) || 0);
  return (amount / precision) * rate;
}
exports.fromLamports = fromLamports;
var SI_SYMBOL = ['', 'k', 'M', 'G', 'T', 'P', 'E'];
var abbreviateNumber = function (number, precision) {
  var tier = (Math.log10(number) / 3) | 0;
  var scaled = number;
  var suffix = SI_SYMBOL[tier];
  if (tier !== 0) {
    var scale = Math.pow(10, tier * 3);
    scaled = number / scale;
  }
  return scaled.toFixed(precision) + suffix;
};
var format = function (val, precision, abbr) {
  return abbr ? abbreviateNumber(val, precision) : val.toFixed(precision);
};
function formatTokenAmount(account, mint, rate, prefix, suffix, precision, abbr) {
  if (rate === void 0) {
    rate = 1.0;
  }
  if (prefix === void 0) {
    prefix = '';
  }
  if (suffix === void 0) {
    suffix = '';
  }
  if (precision === void 0) {
    precision = 6;
  }
  if (abbr === void 0) {
    abbr = false;
  }
  if (!account) {
    return '';
  }
  return '' + [prefix] + format(fromLamports(account, mint, rate), precision, abbr) + suffix;
}
exports.formatTokenAmount = formatTokenAmount;
exports.formatUSD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});
var numberFormater = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
exports.formatNumber = {
  format: function (val) {
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
