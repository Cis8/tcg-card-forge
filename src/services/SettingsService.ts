import type { ISettingsRepository } from '../storage/ISettingsRepository';
import type { GlobalSettings, Faction, Rarity, Keyword, Deck } from '../types';
import { normalizeDeckSettings, DECK_SETTINGS_DEFAULTS } from '../deck-utils';

export class SettingsService {
  private repo: ISettingsRepository;

  constructor(repo: ISettingsRepository) {
    this.repo = repo;
  }

  async load(): Promise<{
    factions: Faction[];
    rarities: Rarity[];
    keywords: Keyword[];
    globalSettings: GlobalSettings | null;
    decks: Deck[];
    currentCardId: string | null;
  }> {
    const [factions, rarities, keywords, globalSettings, decks, currentCardId] =
      await Promise.all([
        this.repo.getFactions(),
        this.repo.getRarities(),
        this.repo.getKeywords(),
        this.repo.getGlobalSettings(),
        this.repo.getDecks(),
        this.repo.getCurrentCardId(),
      ]);

    return { factions, rarities, keywords, globalSettings, decks, currentCardId };
  }

  async saveFactions(v: Faction[]): Promise<void> {
    return this.repo.setFactions(v);
  }

  async saveRarities(v: Rarity[]): Promise<void> {
    return this.repo.setRarities(v);
  }

  async saveKeywords(v: Keyword[]): Promise<void> {
    return this.repo.setKeywords(v);
  }

  async saveGlobalSettings(v: GlobalSettings): Promise<void> {
    return this.repo.setGlobalSettings(v);
  }

  async saveDecks(v: Deck[]): Promise<void> {
    return this.repo.setDecks(v);
  }

  async saveCurrentCardId(id: string | null): Promise<void> {
    return this.repo.setCurrentCardId(id);
  }

  normalizeGlobalSettings(
    raw: Partial<GlobalSettings> | null | undefined,
    fallback: GlobalSettings,
  ): GlobalSettings {
    if (!raw) return fallback;

    const rawDS = (raw.deckSettings ?? {}) as Partial<typeof DECK_SETTINGS_DEFAULTS>;
    const deckSettings = normalizeDeckSettings({
      ...DECK_SETTINGS_DEFAULTS,
      ...(fallback.deckSettings ?? {}),
      ...rawDS,
    });

    return {
      ...fallback,
      ...raw,
      deckSettings,
    };
  }
}
