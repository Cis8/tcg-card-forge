import type { ICardRepository } from '../storage/ICardRepository';
import type { ISettingsRepository } from '../storage/ISettingsRepository';
import { ImageService } from './ImageService';
import type {
  Card,
  CardExport,
  CardWithArt,
  AppSnapshot,
  Deck,
  Faction,
  Rarity,
  Keyword,
  GlobalSettings,
  FrameVariant,
} from '../types';
import { normalizeDeckSettings, DECK_SETTINGS_DEFAULTS } from '../deck-utils';

export type ImportPayload =
  | { kind: 'snapshot'; data: AppSnapshot }
  | { kind: 'card';     data: CardExport[] }
  | { kind: 'deck';     data: Deck[] }
  | { kind: 'unknown';  error: string };

export interface AppliedSnapshotResult {
  cards: CardWithArt[];
  keywords: Keyword[];
  factions: Faction[];
  rarities: Rarity[];
  globalSettings: GlobalSettings;
  decks: Deck[];
}

// ── Internal helpers ──────────────────────────────────────────────────────────

const FRAME_VARIANTS: FrameVariant[] = ['ornate', 'classic', 'inscribed'];

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

// ── ExportService ─────────────────────────────────────────────────────────────

export class ExportService {
  private imageService: ImageService;

  constructor(imageService: ImageService) {
    this.imageService = imageService;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async compressForExport(blob: Blob): Promise<Blob> {
    const bitmap = await createImageBitmap(blob);
    const maxSide = 800;
    const quality = 0.7;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    let canvas: HTMLCanvasElement | OffscreenCanvas;
    let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(w, h);
      ctx = canvas.getContext('2d')!;
    } else {
      canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      ctx = canvas.getContext('2d')!;
    }

    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    return canvas instanceof OffscreenCanvas
      ? canvas.convertToBlob({ type: 'image/jpeg', quality })
      : new Promise<Blob>((res, rej) =>
          (canvas as HTMLCanvasElement).toBlob(
            b => (b ? res(b) : rej(new Error('toBlob failed'))),
            'image/jpeg',
            quality,
          )
        );
  }

  private downloadJson(data: unknown, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private looksLikeDeck(v: unknown): boolean {
    if (!isObject(v)) return false;
    if (!isString(v['id']) || !isString(v['name'])) return false;
    if (!isArray(v['entries'])) return false;
    const entries = v['entries'] as unknown[];
    if (entries.length === 0) return true;
    const first = entries[0];
    return isObject(first) && isString((first as Record<string, unknown>)['cardId']);
  }

  private looksLikeCard(v: unknown): boolean {
    if (!isObject(v)) return false;
    if (!isString(v['id']) || !isString(v['name'])) return false;
    if (!isString(v['type']) || !isString(v['faction'])) return false;
    if (!isString(v['rarity'])) return false;
    if (isArray(v['entries'])) return false; // that's a deck
    return true;
  }

  private normalizeCard(raw: Record<string, unknown>): CardExport {
    const frame: FrameVariant =
      FRAME_VARIANTS.includes(raw['frame'] as FrameVariant)
        ? (raw['frame'] as FrameVariant)
        : 'ornate';

    // Handle both old records (with `art`) and new ones (with `artId`)
    // CardExport shape has `art: string | null` and no `artId`
    const art = isString(raw['art']) ? raw['art'] : null;

    // Build a CardExport — omit artId, keep art
    const { artId: _artId, ...rest } = raw as Record<string, unknown> & { artId?: unknown };
    void _artId;

    return { ...(rest as unknown as CardExport), frame, art };
  }

  private parseSnapshotV3orV4(
    raw: Record<string, unknown>,
    globalSettingsFallback: GlobalSettings,
  ): AppSnapshot | null {
    const version = raw['version'];
    if (version !== 3 && version !== 4) return null;

    if (!isString(raw['exportedAt'])) return null;

    const rawGS = isObject(raw['globalSettings']) ? raw['globalSettings'] : {};
    const rawDS = isObject(rawGS['deckSettings']) ? rawGS['deckSettings'] : {};
    const globalSettings: GlobalSettings = {
      ...globalSettingsFallback,
      ...rawGS,
      deckSettings: normalizeDeckSettings({ ...DECK_SETTINGS_DEFAULTS, ...rawDS }),
    };

    const cards = (isArray(raw['cards']) ? raw['cards'] : [])
      .filter(isObject)
      .map(c => this.normalizeCard(c));

    const keywords = isArray(raw['keywords']) ? (raw['keywords'] as Keyword[]) : [];
    const factions = isArray(raw['factions']) ? (raw['factions'] as Faction[]) : [];
    const rarities = isArray(raw['rarities']) ? (raw['rarities'] as Rarity[]) : [];

    const deckMap = new Map<string, Deck>();
    for (const d of (isArray(raw['decks']) ? raw['decks'] : [])) {
      if (isObject(d) && isString(d['id'])) {
        deckMap.set(d['id'] as string, d as unknown as Deck);
      }
    }
    const decks = [...deckMap.values()];

    return {
      version: 4,
      exportedAt: raw['exportedAt'] as string,
      globalSettings,
      cards,
      keywords,
      factions,
      rarities,
      decks,
    };
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async buildSnapshot(
    cards: Card[],
    keywords: Keyword[],
    factions: Faction[],
    rarities: Rarity[],
    globalSettings: GlobalSettings,
    decks: Deck[],
    opts?: { compact?: boolean },
  ): Promise<AppSnapshot> {
    const cardExports = await Promise.all(
      cards.map(async (card): Promise<CardExport> => {
        let art: string | null = null;

        if (card.artId) {
          let blob = this.imageService.getCachedBlob(card.artId);

          if (!blob) {
            const handle = await this.imageService.resolve(card.artId);
            if (handle) {
              blob = await fetch(handle.objectUrl).then(r => r.blob());
            }
          }

          if (blob) {
            if (opts?.compact) {
              blob = await this.compressForExport(blob);
            }
            art = await this.blobToBase64(blob);
          }
        }

        // CardExport = Card without artId + art field
        const { artId: _artId, ...cardWithoutArtId } = card;
        void _artId;
        return { ...cardWithoutArtId, art };
      })
    );

    return {
      version: 4,
      exportedAt: new Date().toISOString(),
      globalSettings,
      cards: cardExports,
      keywords,
      factions,
      rarities,
      decks,
    };
  }

  downloadSnapshot(snapshot: AppSnapshot, filename?: string): void {
    const date = new Date().toISOString().slice(0, 10);
    this.downloadJson(snapshot, filename ?? `sigil-sinew-backup-${date}.json`);
  }

  async downloadCard(card: Card): Promise<void> {
    const snapshot = await this.buildSnapshot(
      [card],
      [],
      [],
      [],
      {} as GlobalSettings,
      [],
    );
    const safe = (card.name || 'untitled').replace(/[^\w-]+/g, '_');
    this.downloadJson(snapshot.cards[0], `card-${safe}.json`);
  }

  downloadDeck(deck: Deck): void {
    const safe = (deck.name || 'untitled').replace(/[^\w-]+/g, '_');
    this.downloadJson(deck, `deck-${safe}.json`);
  }

  detectImport(raw: unknown, globalSettingsFallback: GlobalSettings): ImportPayload {
    if (!isObject(raw) && !isArray(raw)) {
      return { kind: 'unknown', error: 'Expected a JSON object or array.' };
    }

    // Full snapshot (version 3 or 4)
    if (isObject(raw) && (raw['version'] === 3 || raw['version'] === 4)) {
      const snapshot = this.parseSnapshotV3orV4(raw, globalSettingsFallback);
      if (!snapshot) {
        return { kind: 'unknown', error: `Invalid snapshot format (version ${raw['version']}).` };
      }
      return { kind: 'snapshot', data: snapshot };
    }

    // Array of cards or decks
    if (isArray(raw)) {
      if (raw.length === 0) return { kind: 'unknown', error: 'Empty array — nothing to import.' };
      if (this.looksLikeDeck(raw[0])) {
        const decks = raw.filter(v => this.looksLikeDeck(v)) as unknown as Deck[];
        if (decks.length === 0) return { kind: 'unknown', error: 'No valid decks found in array.' };
        return { kind: 'deck', data: decks };
      }
      if (this.looksLikeCard(raw[0])) {
        const cards = raw
          .filter(v => this.looksLikeCard(v))
          .map(c => this.normalizeCard(c as Record<string, unknown>));
        if (cards.length === 0) return { kind: 'unknown', error: 'No valid cards found in array.' };
        return { kind: 'card', data: cards };
      }
      return { kind: 'unknown', error: 'Array elements are neither cards nor decks.' };
    }

    // Single object
    if (this.looksLikeDeck(raw)) {
      return { kind: 'deck', data: [raw as unknown as Deck] };
    }
    if (this.looksLikeCard(raw)) {
      return { kind: 'card', data: [this.normalizeCard(raw as Record<string, unknown>)] };
    }

    return { kind: 'unknown', error: 'JSON shape not recognised. Expected a card, deck, or full snapshot.' };
  }

  async applySnapshot(
    repos: { cards: ICardRepository; settings: ISettingsRepository },
    imageService: ImageService,
    snapshot: AppSnapshot,
    mode: 'replace' | 'merge',
  ): Promise<AppliedSnapshotResult> {
    if (mode === 'replace') {
      // Release art for all existing cards before replacing
      const existing = await repos.cards.getAll();
      await Promise.all(
        existing
          .filter(c => c.artId)
          .map(c => imageService.releaseArt(c.artId!))
      );
      await repos.cards.deleteAll();
    }

    // Import each card from the snapshot
    const cardWithArts: CardWithArt[] = await Promise.all(
      snapshot.cards.map(async (cardExport): Promise<CardWithArt> => {
        const { art, ...cardBase } = cardExport;

        let artId: string | null = null;
        let artHandle = null;

        if (art) {
          try {
            const handle = await imageService.storeFromDataUrl(art);
            artId = handle.id;
            artHandle = handle;
          } catch (err) {
            console.warn('[ExportService] Failed to store image for card:', cardBase.id, err);
          }
        }

        const card: Card = { ...cardBase, artId };
        await repos.cards.put(card);

        return { ...card, artHandle };
      })
    );

    // Save settings
    await Promise.all([
      repos.settings.setFactions(snapshot.factions),
      repos.settings.setRarities(snapshot.rarities),
      repos.settings.setKeywords(snapshot.keywords),
      repos.settings.setGlobalSettings(snapshot.globalSettings),
      repos.settings.setDecks(snapshot.decks),
    ]);

    return {
      cards: cardWithArts,
      keywords: snapshot.keywords,
      factions: snapshot.factions,
      rarities: snapshot.rarities,
      globalSettings: snapshot.globalSettings,
      decks: snapshot.decks,
    };
  }
}
