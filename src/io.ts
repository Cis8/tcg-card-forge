// io.ts — pure serialization / deserialization / validation for app state.
// No React imports, no side effects.

import type { Card, Faction, Rarity, Keyword, GlobalSettings, FrameVariant } from './types';

const FRAME_VARIANTS: FrameVariant[] = ['ornate', 'classic', 'inscribed'];

function normalizeCard(raw: Record<string, unknown>): Card {
  const frame: FrameVariant =
    FRAME_VARIANTS.includes(raw['frame'] as FrameVariant)
      ? (raw['frame'] as FrameVariant)
      : 'ornate';
  return { ...(raw as unknown as Card), frame };
}

export interface AppSnapshot {
  version: 2;
  exportedAt: string;
  globalSettings: GlobalSettings;
  cards: Card[];
  keywords: Keyword[];
  factions: Faction[];
  rarities: Rarity[];
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

  if (raw['version'] !== 2) {
    return {
      ok: false,
      error: `Unsupported snapshot version: ${JSON.stringify(raw['version'])}. Expected 2.`,
    };
  }

  const exportedAt = raw['exportedAt'];
  if (!isString(exportedAt)) {
    return { ok: false, error: 'Missing or invalid "exportedAt" field.' };
  }

  const rawGS = isObject(raw['globalSettings']) ? (raw['globalSettings'] as Partial<GlobalSettings>) : {};
  const globalSettings: GlobalSettings = { ...globalSettingsFallback, ...rawGS };

  const cards = (isArray(raw['cards']) ? raw['cards'] : []).filter(isObject).map(normalizeCard);
  const keywords = isArray(raw['keywords']) ? (raw['keywords'] as Keyword[]) : [];
  const factions = isArray(raw['factions']) ? (raw['factions'] as Faction[]) : [];
  const rarities = isArray(raw['rarities']) ? (raw['rarities'] as Rarity[])  : [];

  return { ok: true, data: { version: 2, exportedAt, globalSettings, cards, keywords, factions, rarities } };
}

// ── export ─────────────────────────────────────────────────────────────────

export function exportSnapshot(
  cards: Card[],
  keywords: Keyword[],
  factions: Faction[],
  rarities: Rarity[],
  globalSettings: GlobalSettings,
): AppSnapshot {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    globalSettings,
    cards,
    keywords,
    factions,
    rarities,
  };
}

export function downloadSnapshot(snapshot: AppSnapshot): void {
  const date = new Date().toISOString().slice(0, 10);
  const filename = `sigil-sinew-backup-${date}.json`;
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── import / merge ─────────────────────────────────────────────────────────

type AppData = {
  cards: Card[];
  keywords: Keyword[];
  factions: Faction[];
  rarities: Rarity[];
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
      cards:          snapshot.cards,
      keywords:       snapshot.keywords,
      factions:       snapshot.factions,
      rarities:       snapshot.rarities,
      globalSettings: snapshot.globalSettings,
    };
  }

  return {
    cards:          mergeById(existing.cards,    snapshot.cards),
    keywords:       mergeById(existing.keywords, snapshot.keywords),
    factions:       mergeById(existing.factions, snapshot.factions),
    rarities:       mergeById(existing.rarities, snapshot.rarities),
    globalSettings: existing.globalSettings,
  };
}

function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const map = new Map<string, T>(existing.map(item => [item.id, item]));
  for (const item of incoming) map.set(item.id, item);
  return [...map.values()];
}
