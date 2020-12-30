'use strict';
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
var __spreadArrays =
  (this && this.__spreadArrays) ||
  function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++) r[k] = a[j];
    return r;
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.rustString = exports.uint128 = exports.uint64 = exports.publicKey = void 0;
var web3_js_1 = require('@solana/web3.js');
var bn_js_1 = __importDefault(require('bn.js'));
var BufferLayout = __importStar(require('buffer-layout'));
/**
 * Layout for a public key
 */
var publicKey = function (property) {
  if (property === void 0) {
    property = 'publicKey';
  }
  var publicKeyLayout = BufferLayout.blob(32, property);
  var _decode = publicKeyLayout.decode.bind(publicKeyLayout);
  var _encode = publicKeyLayout.encode.bind(publicKeyLayout);
  publicKeyLayout.decode = function (buffer, offset) {
    var data = _decode(buffer, offset);
    return new web3_js_1.PublicKey(data);
  };
  publicKeyLayout.encode = function (key, buffer, offset) {
    return _encode(key.toBuffer(), buffer, offset);
  };
  return publicKeyLayout;
};
exports.publicKey = publicKey;
/**
 * Layout for a 64bit unsigned value
 */
var uint64 = function (property) {
  if (property === void 0) {
    property = 'uint64';
  }
  var layout = BufferLayout.blob(8, property);
  var _decode = layout.decode.bind(layout);
  var _encode = layout.encode.bind(layout);
  layout.decode = function (buffer, offset) {
    var data = _decode(buffer, offset);
    return new bn_js_1.default(
      __spreadArrays(data)
        .reverse()
        .map(function (i) {
          return ('00' + i.toString(16)).slice(-2);
        })
        .join(''),
      16,
    );
  };
  layout.encode = function (num, buffer, offset) {
    var a = num.toArray().reverse();
    var b = Buffer.from(a);
    if (b.length !== 8) {
      var zeroPad = Buffer.alloc(8);
      b.copy(zeroPad);
      b = zeroPad;
    }
    return _encode(b, buffer, offset);
  };
  return layout;
};
exports.uint64 = uint64;
// TODO: wrap in BN (what about decimals?)
var uint128 = function (property) {
  if (property === void 0) {
    property = 'uint128';
  }
  var layout = BufferLayout.blob(16, property);
  var _decode = layout.decode.bind(layout);
  var _encode = layout.encode.bind(layout);
  layout.decode = function (buffer, offset) {
    var data = _decode(buffer, offset);
    return new bn_js_1.default(
      __spreadArrays(data)
        .reverse()
        .map(function (i) {
          return ('00' + i.toString(16)).slice(-2);
        })
        .join(''),
      16,
    );
  };
  layout.encode = function (num, buffer, offset) {
    var a = num.toArray().reverse();
    var b = Buffer.from(a);
    if (b.length !== 16) {
      var zeroPad = Buffer.alloc(16);
      b.copy(zeroPad);
      b = zeroPad;
    }
    return _encode(b, buffer, offset);
  };
  return layout;
};
exports.uint128 = uint128;
/**
 * Layout for a Rust String type
 */
var rustString = function (property) {
  if (property === void 0) {
    property = 'string';
  }
  var rsl = BufferLayout.struct(
    [
      BufferLayout.u32('length'),
      BufferLayout.u32('lengthPadding'),
      BufferLayout.blob(BufferLayout.offset(BufferLayout.u32(), -8), 'chars'),
    ],
    property,
  );
  var _decode = rsl.decode.bind(rsl);
  var _encode = rsl.encode.bind(rsl);
  rsl.decode = function (buffer, offset) {
    var data = _decode(buffer, offset);
    return data.chars.toString('utf8');
  };
  rsl.encode = function (str, buffer, offset) {
    var data = {
      chars: Buffer.from(str, 'utf8'),
    };
    return _encode(data, buffer, offset);
  };
  return rsl;
};
exports.rustString = rustString;
