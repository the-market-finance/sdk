import { EventEmitter as Emitter } from "eventemitter3";
var CacheUpdateEvent = /** @class */ (function () {
    function CacheUpdateEvent(id, isNew, parser) {
        this.id = id;
        this.parser = parser;
        this.isNew = isNew;
    }
    CacheUpdateEvent.type = "CacheUpdate";
    return CacheUpdateEvent;
}());
export { CacheUpdateEvent };
var AccountUpdateEvent = /** @class */ (function () {
    function AccountUpdateEvent(id) {
        this.id = id;
    }
    AccountUpdateEvent.type = "AccountUpdate";
    return AccountUpdateEvent;
}());
export { AccountUpdateEvent };
var MarketUpdateEvent = /** @class */ (function () {
    function MarketUpdateEvent(ids) {
        this.ids = ids;
    }
    MarketUpdateEvent.type = "MarketUpdate";
    return MarketUpdateEvent;
}());
export { MarketUpdateEvent };
var EventEmitter = /** @class */ (function () {
    function EventEmitter() {
        this.emitter = new Emitter();
    }
    EventEmitter.prototype.onMarket = function (callback) {
        var _this = this;
        this.emitter.on(MarketUpdateEvent.type, callback);
        return function () { return _this.emitter.removeListener(MarketUpdateEvent.type, callback); };
    };
    EventEmitter.prototype.onCache = function (callback) {
        var _this = this;
        this.emitter.on(CacheUpdateEvent.type, callback);
        return function () { return _this.emitter.removeListener(CacheUpdateEvent.type, callback); };
    };
    EventEmitter.prototype.onAccount = function (callback) {
        var _this = this;
        this.emitter.on(AccountUpdateEvent.type, callback);
        return function () { return _this.emitter.removeListener(AccountUpdateEvent.type, callback); };
    };
    EventEmitter.prototype.raiseAccountUpdated = function (id) {
        this.emitter.emit(AccountUpdateEvent.type, new AccountUpdateEvent(id));
    };
    EventEmitter.prototype.raiseMarketUpdated = function (ids) {
        this.emitter.emit(MarketUpdateEvent.type, new MarketUpdateEvent(ids));
    };
    EventEmitter.prototype.raiseCacheUpdated = function (id, isNew, parser) {
        this.emitter.emit(CacheUpdateEvent.type, new CacheUpdateEvent(id, isNew, parser));
    };
    return EventEmitter;
}());
export { EventEmitter };
