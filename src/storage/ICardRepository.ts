import type { IRepository } from './IRepository';
import type { Card } from '../types';

export interface ICardRepository extends IRepository<Card> {
  getByFaction(factionId: string): Promise<Card[]>;
  // Returns all card IDs whose artId matches the given artId
  getIdsByArtId(artId: string): Promise<string[]>;
}
