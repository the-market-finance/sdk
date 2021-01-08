import bs58 from "bs58";
var convertAmount = function (amount, mint) {
    return parseFloat(amount) * Math.pow(10, (mint === null || mint === void 0 ? void 0 : mint.decimals) || 0);
};
var isValidAddress = function (address) {
    try {
        var decoded = bs58.decode(address);
        return decoded.length === 32;
    }
    catch (_a) {
        return false;
    }
};
function getDefaultTokens(tokens, search) {
    var defaultBase = "SOL";
    var defaultQuote = "USDC";
    var nameToToken = tokens.reduce(function (map, item) {
        map.set(item.tokenSymbol, item);
        return map;
    }, new Map());
    if (search) {
        var urlParams = new URLSearchParams(search);
        var pair = urlParams.get("pair");
        if (pair) {
            var items = pair.split("-");
            if (items.length > 1) {
                if (nameToToken.has(items[0]) || isValidAddress(items[0])) {
                    defaultBase = items[0];
                }
                if (nameToToken.has(items[1]) || isValidAddress(items[1])) {
                    defaultQuote = items[1];
                }
            }
        }
    }
    return {
        defaultBase: defaultBase,
        defaultQuote: defaultQuote,
    };
}
