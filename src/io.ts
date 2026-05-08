// io.ts — pure serialization / deserialization / validation for app state.
// No React imports, no side effects.

import type { Card, Faction, Rarity, Keyword } from './types';

export interface AppSnapshot {
  version: 1;
  exportedAt: string; // ISO date string
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

/**
 * Parse and validate a JSON value that claims to be an AppSnapshot.
 * Returns a discriminated union — never throws.
 */
export function parseSnapshot(raw: unknown): ParseResult {
  if (!isObject(raw)) {
    return { ok: false, error: 'Invalid JSON: expected an object at the root.' };
  }

  const version = raw['version'];
  if (version !== 1) {
    return {
      ok: false,
      error: `Unsupported snapshot version: ${JSON.stringify(version)}. Expected 1.`,
    };
  }

  const exportedAt = raw['exportedAt'];
  if (!isString(exportedAt)) {
    return { ok: false, error: 'Missing or invalid "exportedAt" field.' };
  }

  // Sub-arrays are validated leniently: wrong type → empty array (not a crash).
  const cards     = isArray(raw['cards'])    ? (raw['cards']    as Card[])    : [];
  const keywords  = isArray(raw['keywords']) ? (raw['keywords'] as Keyword[]) : [];
  const factions  = isArray(raw['factions']) ? (raw['factions'] as Faction[]) : [];
  const rarities  = isArray(raw['rarities']) ? (raw['rarities'] as Rarity[])  : [];

  return {
    ok: true,
    data: { version: 1, exportedAt, cards, keywords, factions, rarities },
  };
}

// ── export ─────────────────────────────────────────────────────────────────

export function exportSnapshot(
  cards: Card[],
  keywords: Keyword[],
  factions: Faction[],
  rarities: Rarity[],
): AppSnapshot {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    cards,
    keywords,
    factions,
    rarities,
  };
}

/** Triggers a browser file download for the given snapshot. */
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
};

/**
 * Apply a parsed snapshot onto existing app data.
 *
 * - replace: incoming snapshot fully replaces existing data.
 * - merge: deduplicates by `id`; imported items take precedence over
 *   existing items with the same id, new items are appended.
 */
export function applySnapshot(
  existing: AppData,
  snapshot: AppSnapshot,
  mode: 'replace' | 'merge',
): AppData {
  if (mode === 'replace') {
    return {
      cards:    snapshot.cards,
      keywords: snapshot.keywords,
      factions: snapshot.factions,
      rarities: snapshot.rarities,
    };
  }

  // merge — incoming wins on id collision
  return {
    cards:    mergeById(existing.cards,    snapshot.cards),
    keywords: mergeById(existing.keywords, snapshot.keywords),
    factions: mergeById(existing.factions, snapshot.factions),
    rarities: mergeById(existing.rarities, snapshot.rarities),
  };
}

function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const map = new Map<string, T>(existing.map(item => [item.id, item]));
  for (const item of incoming) map.set(item.id, item); // incoming wins
  return [...map.values()];
}
