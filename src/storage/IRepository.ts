export interface IRepository<T extends { id: string }> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  put(entity: T): Promise<void>;
  putMany(entities: T[]): Promise<void>;
  delete(id: string): Promise<void>;
  deleteAll(): Promise<void>;
}
