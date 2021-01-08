
import { MintInfo } from "@solana/spl-token";
import { convert, getTokenIcon, getTokenName, KnownToken } from "./utils";
import bs58 from "bs58";
const convertAmount = (amount: string, mint?: MintInfo) => {
    return parseFloat(amount) * Math.pow(10, mint?.decimals || 0);
};

const isValidAddress = (address: string) => {
    try {
        const decoded = bs58.decode(address);
        return decoded.length === 32;
    } catch {
        return false;
    }
};

function getDefaultTokens(tokens: KnownToken[], search: string) {
    let defaultBase = "SOL";
    let defaultQuote = "USDC";

    const nameToToken = tokens.reduce((map, item) => {
        map.set(item.tokenSymbol, item);
        return map;
    }, new Map<string, any>());

    if (search) {
        const urlParams = new URLSearchParams(search);
        const pair = urlParams.get("pair");
        if (pair) {
            let items = pair.split("-");

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
        defaultBase,
        defaultQuote,
    };
}
