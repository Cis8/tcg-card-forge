import type { Card } from '../types';

export class IdbCardRepository {
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

  private tx(mode: IDBTransactionMode): IDBObjectStore {
    return this.db.transaction('cards', mode).objectStore('cards');
  }

  async getAll(): Promise<Card[]> {
    return this.req(this.tx('readonly').getAll());
  }

  async getById(id: string): Promise<Card | null> {
    const result = await this.req(this.tx('readonly').get(id));
    return result ?? null;
  }

  async put(entity: Card): Promise<void> {
    await this.req(this.tx('readwrite').put(entity));
  }

  async putMany(entities: Card[]): Promise<void> {
    if (entities.length === 0) return;
    const transaction = this.db.transaction('cards', 'readwrite');
    const store = transaction.objectStore('cards');
    await Promise.all(
      entities.map(entity => this.req(store.put(entity)))
    );
  }

  async delete(id: string): Promise<void> {
    await this.req(this.tx('readwrite').delete(id));
  }

  async deleteAll(): Promise<void> {
    await this.req(this.tx('readwrite').clear());
  }

  async getByFaction(factionId: string): Promise<Card[]> {
    const store = this.tx('readonly');
    return this.req(store.index('by-faction').getAll(factionId));
  }

  async getIdsByArtId(artId: string): Promise<string[]> {
    const store = this.tx('readonly');
    const cards = await this.req<Card[]>(store.index('by-artId').getAll(artId));
    return cards.map(c => c.id);
  }
}
