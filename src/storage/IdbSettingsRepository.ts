import type { Faction, Rarity, Keyword, GlobalSettings, Deck } from '../types';

interface SettingsRecord {
  key: string;
  value: unknown;
}

export class IdbSettingsRepository {
  private db: IDBDatabase;

  constructor(db: IDBDatabase) {
    this.db = db;
  }

  private req<T>(r: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }

  private async get<T>(key: string): Promise<T | null> {
    const transaction = this.db.transaction('settings', 'readonly');
    const store = transaction.objectStore('settings');
    const record = await this.req<SettingsRecord | undefined>(store.get(key));
    if (!record) return null;
    return record.value as T;
  }

  private async set(key: string, value: unknown): Promise<void> {
    const transaction = this.db.transaction('settings', 'readwrite');
    const store = transaction.objectStore('settings');
    await this.req(store.put({ key, value }));
  }

  async getFactions(): Promise<Faction[]> {
    return (await this.get<Faction[]>('factions')) ?? [];
  }

  async getRarities(): Promise<Rarity[]> {
    return (await this.get<Rarity[]>('rarities')) ?? [];
  }

  async getKeywords(): Promise<Keyword[]> {
    return (await this.get<Keyword[]>('keywords')) ?? [];
  }

  async getGlobalSettings(): Promise<GlobalSettings | null> {
    return this.get<GlobalSettings>('globalSettings');
  }

  async getDecks(): Promise<Deck[]> {
    return (await this.get<Deck[]>('decks')) ?? [];
  }

  async getCurrentCardId(): Promise<string | null> {
    return this.get<string>('currentCardId');
  }

  async setFactions(v: Faction[]): Promise<void> {
    return this.set('factions', v);
  }

  async setRarities(v: Rarity[]): Promise<void> {
    return this.set('rarities', v);
  }

  async setKeywords(v: Keyword[]): Promise<void> {
    return this.set('keywords', v);
  }

  async setGlobalSettings(v: GlobalSettings): Promise<void> {
    return this.set('globalSettings', v);
  }

  async setDecks(v: Deck[]): Promise<void> {
    return this.set('decks', v);
  }

  async setCurrentCardId(id: string | null): Promise<void> {
    return this.set('currentCardId', id);
  }
}
