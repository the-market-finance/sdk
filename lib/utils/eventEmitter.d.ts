export declare class CacheUpdateEvent {
    static type: string;
    id: string;
    parser: any;
    isNew: boolean;
    constructor(id: string, isNew: boolean, parser: any);
}
export declare class AccountUpdateEvent {
    static type: string;
    id: string;
    constructor(id: string);
}
export declare class MarketUpdateEvent {
    static type: string;
    ids: Set<string>;
    constructor(ids: Set<string>);
}
export declare class EventEmitter {
    private emitter;
    onMarket(callback: (args: MarketUpdateEvent) => void): () => import("eventemitter3")<string | symbol, any>;
    onCache(callback: (args: CacheUpdateEvent) => void): () => import("eventemitter3")<string | symbol, any>;
    onAccount(callback: (args: AccountUpdateEvent) => void): () => import("eventemitter3")<string | symbol, any>;
    raiseAccountUpdated(id: string): void;
    raiseMarketUpdated(ids: Set<string>): void;
    raiseCacheUpdated(id: string, isNew: boolean, parser: any): void;
}
