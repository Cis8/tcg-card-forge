import type { StoredImage } from '../types';

export class IdbImageRepository {
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
    return this.db.transaction('images', mode).objectStore('images');
  }

  async getAll(): Promise<StoredImage[]> {
    return this.req(this.tx('readonly').getAll());
  }

  async getById(id: string): Promise<StoredImage | null> {
    const result = await this.req(this.tx('readonly').get(id));
    return result ?? null;
  }

  async put(entity: StoredImage): Promise<void> {
    await this.req(this.tx('readwrite').put(entity));
  }

  async putMany(entities: StoredImage[]): Promise<void> {
    if (entities.length === 0) return;
    const transaction = this.db.transaction('images', 'readwrite');
    const store = transaction.objectStore('images');
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

  async getOrphaned(): Promise<StoredImage[]> {
    const store = this.tx('readonly');
    return this.req(store.index('by-refcount').getAll(0));
  }

  async incrementRef(id: string): Promise<void> {
    const transaction = this.db.transaction('images', 'readwrite');
    const store = transaction.objectStore('images');
    const record = await this.req<StoredImage | undefined>(store.get(id));
    if (!record) return;
    await this.req(store.put({ ...record, refCount: record.refCount + 1 }));
  }

  async decrementRef(id: string): Promise<void> {
    const transaction = this.db.transaction('images', 'readwrite');
    const store = transaction.objectStore('images');
    const record = await this.req<StoredImage | undefined>(store.get(id));
    if (!record) return;
    await this.req(store.put({ ...record, refCount: Math.max(0, record.refCount - 1) }));
  }
}
