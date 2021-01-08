import { EventEmitter as Emitter } from "eventemitter3";

export class CacheUpdateEvent {
  static type = "CacheUpdate";
  id: string;
  parser: any;
  isNew: boolean;
  constructor(id: string, isNew: boolean, parser: any) {
    this.id = id;
    this.parser = parser;
    this.isNew = isNew;
  }
}

export class AccountUpdateEvent {
  static type = "AccountUpdate";
  id: string;
  constructor(id: string) {
    this.id = id;
  }
}

export class MarketUpdateEvent {
  static type = "MarketUpdate";
  ids: Set<string>;
  constructor(ids: Set<string>) {
    this.ids = ids;
  }
}

export class EventEmitter {
  private emitter = new Emitter();

  onMarket(callback: (args: MarketUpdateEvent) => void) {
    this.emitter.on(MarketUpdateEvent.type, callback);

    return () => this.emitter.removeListener(MarketUpdateEvent.type, callback);
  }

  onCache(callback: (args: CacheUpdateEvent) => void) {
    this.emitter.on(CacheUpdateEvent.type, callback);

    return () => this.emitter.removeListener(CacheUpdateEvent.type, callback);
  }

  onAccount(callback: (args: AccountUpdateEvent) => void) {
    this.emitter.on(AccountUpdateEvent.type, callback);

    return () => this.emitter.removeListener(AccountUpdateEvent.type, callback);
  }

  raiseAccountUpdated(id: string) {
    this.emitter.emit(AccountUpdateEvent.type, new AccountUpdateEvent(id));
  }

  raiseMarketUpdated(ids: Set<string>) {
    this.emitter.emit(MarketUpdateEvent.type, new MarketUpdateEvent(ids));
  }

  raiseCacheUpdated(id: string, isNew: boolean, parser: any) {
    this.emitter.emit(CacheUpdateEvent.type, new CacheUpdateEvent(id, isNew, parser));
  }
}
