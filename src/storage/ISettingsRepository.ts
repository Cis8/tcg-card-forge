import type { Faction, Rarity, Keyword, GlobalSettings, Deck } from '../types';

export interface ISettingsRepository {
  getFactions(): Promise<Faction[]>;
  getRarities(): Promise<Rarity[]>;
  getKeywords(): Promise<Keyword[]>;
  getGlobalSettings(): Promise<GlobalSettings | null>;
  getDecks(): Promise<Deck[]>;
  getCurrentCardId(): Promise<string | null>;

  setFactions(v: Faction[]): Promise<void>;
  setRarities(v: Rarity[]): Promise<void>;
  setKeywords(v: Keyword[]): Promise<void>;
  setGlobalSettings(v: GlobalSettings): Promise<void>;
  setDecks(v: Deck[]): Promise<void>;
  setCurrentCardId(id: string | null): Promise<void>;
}
