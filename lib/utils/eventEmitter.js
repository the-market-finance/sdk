"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmitter = exports.MarketUpdateEvent = exports.CacheUpdateEvent = void 0;
const eventemitter3_1 = require("eventemitter3");
class CacheUpdateEvent {
    constructor(id, isNew, parser) {
        this.id = id;
        this.parser = parser;
        this.isNew = isNew;
    }
}
exports.CacheUpdateEvent = CacheUpdateEvent;
CacheUpdateEvent.type = 'CacheUpdate';
class MarketUpdateEvent {
    constructor(ids) {
        this.ids = ids;
    }
}
exports.MarketUpdateEvent = MarketUpdateEvent;
MarketUpdateEvent.type = 'MarketUpdate';
class EventEmitter {
    constructor() {
        this.emitter = new eventemitter3_1.EventEmitter();
    }
    onMarket(callback) {
        this.emitter.on(MarketUpdateEvent.type, callback);
        return () => this.emitter.removeListener(MarketUpdateEvent.type, callback);
    }
    onCache(callback) {
        this.emitter.on(CacheUpdateEvent.type, callback);
        return () => this.emitter.removeListener(CacheUpdateEvent.type, callback);
    }
    raiseMarketUpdated(ids) {
        this.emitter.emit(MarketUpdateEvent.type, new MarketUpdateEvent(ids));
    }
    raiseCacheUpdated(id, isNew, parser) {
        this.emitter.emit(CacheUpdateEvent.type, new CacheUpdateEvent(id, isNew, parser));
    }
}
exports.EventEmitter = EventEmitter;
