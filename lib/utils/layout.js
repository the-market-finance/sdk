var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import * as BufferLayout from 'buffer-layout';
/**
 * Layout for a public key
 */
export var publicKey = function (property) {
    if (property === void 0) { property = 'publicKey'; }
    var publicKeyLayout = BufferLayout.blob(32, property);
    var _decode = publicKeyLayout.decode.bind(publicKeyLayout);
    var _encode = publicKeyLayout.encode.bind(publicKeyLayout);
    publicKeyLayout.decode = function (buffer, offset) {
        var data = _decode(buffer, offset);
        return new PublicKey(data);
    };
    publicKeyLayout.encode = function (key, buffer, offset) {
        return _encode(key.toBuffer(), buffer, offset);
    };
    return publicKeyLayout;
};
/**
 * Layout for a 64bit unsigned value
 */
export var uint64 = function (property) {
    if (property === void 0) { property = 'uint64'; }
    var layout = BufferLayout.blob(8, property);
    var _decode = layout.decode.bind(layout);
    var _encode = layout.encode.bind(layout);
    layout.decode = function (buffer, offset) {
        var data = _decode(buffer, offset);
        return new BN(__spread(data).reverse()
            .map(function (i) { return ("00" + i.toString(16)).slice(-2); })
            .join(''), 16);
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
// TODO: wrap in BN (what about decimals?)
export var uint128 = function (property) {
    if (property === void 0) { property = 'uint128'; }
    var layout = BufferLayout.blob(16, property);
    var _decode = layout.decode.bind(layout);
    var _encode = layout.encode.bind(layout);
    layout.decode = function (buffer, offset) {
        var data = _decode(buffer, offset);
        return new BN(__spread(data).reverse()
            .map(function (i) { return ("00" + i.toString(16)).slice(-2); })
            .join(''), 16);
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
/**
 * Layout for a Rust String type
 */
export var rustString = function (property) {
    if (property === void 0) { property = 'string'; }
    var rsl = BufferLayout.struct([
        BufferLayout.u32('length'),
        BufferLayout.u32('lengthPadding'),
        BufferLayout.blob(BufferLayout.offset(BufferLayout.u32(), -8), 'chars'),
    ], property);
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
