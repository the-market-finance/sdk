'use strict';
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, {
          enumerable: true,
          get: function () {
            return m[k];
          },
        });
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.LendingMarketParser = exports.isLendingMarket = exports.LendingMarketLayout = void 0;
var BufferLayout = __importStar(require('buffer-layout'));
var Layout = __importStar(require('./../../utils/layout'));
exports.LendingMarketLayout = BufferLayout.struct([BufferLayout.u8('isInitialized'), Layout.publicKey('quoteMint')]);
var isLendingMarket = function (info) {
  return info.data.length === exports.LendingMarketLayout.span;
};
exports.isLendingMarket = isLendingMarket;
var LendingMarketParser = function (pubKey, info) {
  var buffer = Buffer.from(info.data);
  var data = exports.LendingMarketLayout.decode(buffer);
  var details = {
    pubkey: pubKey,
    account: __assign({}, info),
    info: data,
  };
  return details;
};
exports.LendingMarketParser = LendingMarketParser;
// TODO:
// create instructions for init
