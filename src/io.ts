// io.ts — pure serialization / deserialization / validation for app state.
// No React imports, no side effects.

import type { Card, Deck, Faction, Rarity, Keyword, GlobalSettings, FrameVariant } from './types';
import { normalizeDeckSettings, DECK_SETTINGS_DEFAULTS } from './deck-utils';

const FRAME_VARIANTS: FrameVariant[] = ['ornate', 'classic', 'inscribed'];

function normalizeCard(raw: Record<string, unknown>): Card {
  const frame: FrameVariant =
    FRAME_VARIANTS.includes(raw['frame'] as FrameVariant)
      ? (raw['frame'] as FrameVariant)
      : 'ornate';
  return { ...(raw as unknown as Card), frame };
}

export interface AppSnapshot {
  version: 3;
  exportedAt: string;
  globalSettings: GlobalSettings;
  cards: Card[];
  keywords: Keyword[];
  factions: Faction[];
  rarities: Rarity[];
  decks: Deck[];
}

// ── helpers ────────────────────────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

// ── validation ─────────────────────────────────────────────────────────────

type ParseResult =
  | { ok: true; data: AppSnapshot }
  | { ok: false; error: string };

export function parseSnapshot(
  raw: unknown,
  globalSettingsFallback: GlobalSettings,
): ParseResult {
  if (!isObject(raw)) {
    return { ok: false, error: 'Invalid JSON: expected an object at the root.' };
  }

  if (raw['version'] !== 3) {
    return {
      ok: false,
      error: `Unsupported snapshot version: ${JSON.stringify(raw['version'])}. Expected version 3.`,
    };
  }

  const exportedAt = raw['exportedAt'];
  if (!isString(exportedAt)) {
    return { ok: false, error: 'Missing or invalid "exportedAt" field.' };
  }

  const rawGS = isObject(raw['globalSettings']) ? raw['globalSettings'] : {};
  // Deep-merge deckSettings so partial imports don't lose nested fields
  const rawDS = isObject(rawGS['deckSettings']) ? rawGS['deckSettings'] : {};
  const globalSettings: GlobalSettings = {
    ...globalSettingsFallback,
    ...rawGS,
    deckSettings: normalizeDeckSettings({ ...DECK_SETTINGS_DEFAULTS, ...rawDS }),
  };

  const cards = (isArray(raw['cards']) ? raw['cards'] : []).filter(isObject).map(normalizeCard);
  const keywords = isArray(raw['keywords']) ? (raw['keywords'] as Keyword[]) : [];
  const factions = isArray(raw['factions']) ? (raw['factions'] as Faction[]) : [];
  const rarities = isArray(raw['rarities']) ? (raw['rarities'] as Rarity[])  : [];

  // Deduplicate deck IDs (last occurrence wins) to prevent React key conflicts
  const deckMap = new Map<string, Deck>();
  for (const d of (isArray(raw['decks']) ? raw['decks'] : [])) {
    if (isObject(d) && isString(d['id'] as unknown)) deckMap.set(d['id'] as string, d as unknown as Deck);
  }
  const decks = [...deckMap.values()];

  return { ok: true, data: { version: 3, exportedAt, globalSettings, cards, keywords, factions, rarities, decks } };
}

// ── export ─────────────────────────────────────────────────────────────────

export function exportSnapshot(
  cards: Card[],
  keywords: Keyword[],
  factions: Faction[],
  rarities: Rarity[],
  globalSettings: GlobalSettings,
  decks: Deck[],
): AppSnapshot {
  return {
    version: 3,
    exportedAt: new Date().toISOString(),
    globalSettings,
    cards,
    keywords,
    factions,
    rarities,
    decks,
  };
}

function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadSnapshot(snapshot: AppSnapshot): void {
  const date = new Date().toISOString().slice(0, 10);
  downloadJson(snapshot, `sigil-sinew-backup-${date}.json`);
}

export function exportCard(card: Card): void {
  const safe = (card.name || 'untitled').replace(/[^\w-]+/g, '_');
  downloadJson(card, `card-${safe}.json`);
}

export function exportDeck(deck: Deck): void {
  const safe = (deck.name || 'untitled').replace(/[^\w-]+/g, '_');
  downloadJson(deck, `deck-${safe}.json`);
}

// ── import / merge ─────────────────────────────────────────────────────────

type AppData = {
  cards: Card[];
  keywords: Keyword[];
  factions: Faction[];
  rarities: Rarity[];
  decks: Deck[];
  globalSettings: GlobalSettings;
};

/**
 * Apply a parsed snapshot onto existing app data.
 *
 * - replace: incoming snapshot fully replaces all data including globalSettings.
 * - merge: deduplicates by id (imported wins on conflict); globalSettings is preserved.
 */
export function applySnapshot(
  existing: AppData,
  snapshot: AppSnapshot,
  mode: 'replace' | 'merge',
): AppData {
  if (mode === 'replace') {
    return {
      cards:          deduplicateById(snapshot.cards),
      keywords:       deduplicateById(snapshot.keywords),
      factions:       deduplicateById(snapshot.factions),
      rarities:       deduplicateById(snapshot.rarities),
      decks:          deduplicateById(snapshot.decks),
      globalSettings: snapshot.globalSettings,
    };
  }

  return {
    cards:          mergeById(existing.cards,    snapshot.cards),
    keywords:       mergeById(existing.keywords, snapshot.keywords),
    factions:       mergeById(existing.factions, snapshot.factions),
    rarities:       mergeById(existing.rarities, snapshot.rarities),
    decks:          mergeById(existing.decks,    snapshot.decks),
    globalSettings: existing.globalSettings,
  };
}

function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) map.set(item.id, item);
  return [...map.values()];
}

export function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const map = new Map<string, T>(existing.map(item => [item.id, item]));
  for (const item of incoming) map.set(item.id, item);
  return [...map.values()];
}

// ── flexible import detection ────────────────────────────────────────────────

export type ImportPayload =
  | { kind: 'snapshot'; data: AppSnapshot }
  | { kind: 'card';     data: Card[] }
  | { kind: 'deck';     data: Deck[] }
  | { kind: 'unknown';  error: string };

function looksLikeDeck(v: unknown): boolean {
  if (!isObject(v)) return false;
  if (!isString(v['id']) || !isString(v['name'])) return false;
  if (!isArray(v['entries'])) return false;
  const entries = v['entries'] as unknown[];
  if (entries.length === 0) return true;
  const first = entries[0];
  return isObject(first) && isString((first as Record<string,unknown>)['cardId']);
}

function looksLikeCard(v: unknown): boolean {
  if (!isObject(v)) return false;
  if (!isString(v['id']) || !isString(v['name'])) return false;
  if (!isString(v['type']) || !isString(v['faction'])) return false;
  if (!isString(v['rarity'])) return false;
  if (isArray(v['entries'])) return false; // that's a deck
  return true;
}

export function detectImport(raw: unknown, globalSettingsFallback: GlobalSettings): ImportPayload {
  if (!isObject(raw) && !isArray(raw)) {
    return { kind: 'unknown', error: 'Expected a JSON object or array.' };
  }

  // Full snapshot
  if (isObject(raw) && raw['version'] === 3) {
    const result = parseSnapshot(raw, globalSettingsFallback);
    if (!result.ok) return { kind: 'unknown', error: result.error };
    return { kind: 'snapshot', data: result.data };
  }

  // Array of cards or decks
  if (isArray(raw)) {
    if (raw.length === 0) return { kind: 'unknown', error: 'Empty array — nothing to import.' };
    if (looksLikeDeck(raw[0])) {
      const decks = raw.filter(looksLikeDeck) as unknown as Deck[];
      if (decks.length === 0) return { kind: 'unknown', error: 'No valid decks found in array.' };
      return { kind: 'deck', data: decks };
    }
    if (looksLikeCard(raw[0])) {
      const cards = raw.filter(looksLikeCard).map(c => normalizeCard(c as Record<string, unknown>));
      if (cards.length === 0) return { kind: 'unknown', error: 'No valid cards found in array.' };
      return { kind: 'card', data: cards };
    }
    return { kind: 'unknown', error: 'Array elements are neither cards nor decks.' };
  }

  // Single object
  if (looksLikeDeck(raw)) return { kind: 'deck', data: [raw as unknown as Deck] };
  if (looksLikeCard(raw)) return { kind: 'card', data: [normalizeCard(raw as Record<string, unknown>)] };

  return { kind: 'unknown', error: 'JSON shape not recognised. Expected a card, deck, or full snapshot.' };
}
