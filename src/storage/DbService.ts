export class DbService {
  private static dbPromise: Promise<IDBDatabase> | null = null;
  static readonly DB_NAME = 'tcg-forge-db';
  static readonly DB_VERSION = 1;

  static open(migrateCallback?: (db: IDBDatabase) => Promise<void>): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DbService.DB_NAME, DbService.DB_VERSION);

      request.onerror = () => {
        DbService.dbPromise = null;
        reject(request.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // cards store
        if (!db.objectStoreNames.contains('cards')) {
          const cardsStore = db.createObjectStore('cards', { keyPath: 'id' });
          cardsStore.createIndex('by-faction', 'faction', { unique: false });
          cardsStore.createIndex('by-artId', 'artId', { unique: false });
        }

        // images store
        if (!db.objectStoreNames.contains('images')) {
          const imagesStore = db.createObjectStore('images', { keyPath: 'id' });
          imagesStore.createIndex('by-refcount', 'refCount', { unique: false });
        }

        // settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = async () => {
        const db = request.result;
        try {
          if (migrateCallback) {
            await migrateCallback(db);
          }
        } catch (err) {
          console.warn('[DbService] migrateCallback failed:', err);
        }
        resolve(db);
      };
    });

    return this.dbPromise;
  }
}
