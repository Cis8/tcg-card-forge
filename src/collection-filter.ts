// collection-filter.ts — pure filtering logic for the Collection view.
// Keyword detection reuses the same regex/normalization as card-preview.tsx.

import type { Card, Keyword } from './types';

/** Cost values shown as filter chips: 0-9 exact, 10 means "10 or more". */
export const COST_FILTER_VALUES = [0,1,2,3,4,5,6,7,8,9,10] as const;
export const COST_PLUS_THRESHOLD = 10;

export interface CollectionFilters {
  factions: string[];   // faction ids — OR semantics (card must be IN the set)
  costs:    number[];   // 0-9 = exact match; 10 = card.cost >= 10 — OR semantics
  keywords: string[];   // keyword ids — AND semantics (card must have ALL)
  search:   string;     // case-insensitive substring: name, subtype, description
}

export function createEmptyFilters(): CollectionFilters {
  return { factions: [], costs: [], keywords: [], search: '' };
}

export function hasActiveFilters(f: CollectionFilters): boolean {
  return (
    f.factions.length > 0 ||
    f.costs.length > 0 ||
    f.keywords.length > 0 ||
    f.search.trim() !== ''
  );
}

/** Extract the ids of all keywords mentioned as [Name] in a card description.
 *  Matches the same regex + normalization used in card-preview.tsx. */
export function extractCardKeywordIds(description: string, keywords: Keyword[]): Set<string> {
  const found = new Set<string>();
  for (const m of description.matchAll(/\[([^\]\n]+)\]/g)) {
    const name = m[1].trim().toLowerCase();
    const kw = keywords.find(k => k.name.trim().toLowerCase() === name);
    if (kw) found.add(kw.id);
  }
  return found;
}

/** Apply all active filters with intersection (AND across filter groups).
 *  Within factions: OR (card belongs to any selected faction).
 *  Within costs:    OR (card matches any selected cost bucket).
 *  Within keywords: AND (card must carry every selected keyword). */
export function applyFilters(
  cards: Card[],
  filters: CollectionFilters,
  keywords: Keyword[],
): Card[] {
  const { factions, costs, keywords: kwIds, search } = filters;
  const q = search.trim().toLowerCase();

  return cards.filter(card => {
    if (factions.length > 0 && !factions.includes(card.faction)) return false;

    if (costs.length > 0) {
      const matchesCost = costs.some(c =>
        c === COST_PLUS_THRESHOLD ? card.cost >= COST_PLUS_THRESHOLD : card.cost === c
      );
      if (!matchesCost) return false;
    }

    if (kwIds.length > 0) {
      const cardKwIds = extractCardKeywordIds(card.description, keywords);
      if (!kwIds.every(id => cardKwIds.has(id))) return false;
    }

    if (q) {
      const haystack = [card.name, card.subtype, card.description]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}
