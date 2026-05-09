import type { IRepository } from './IRepository';
import type { StoredImage } from '../types';

export interface IImageRepository extends IRepository<StoredImage> {
  getOrphaned(): Promise<StoredImage[]>; // refCount === 0
  incrementRef(id: string): Promise<void>;
  decrementRef(id: string): Promise<void>;
}
