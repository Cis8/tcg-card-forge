// collection-filter.ts — pure filtering logic for the Collection view.
// Keyword detection reuses the same regex/normalization as card-preview.tsx.

import type { Card, Keyword } from './types';

export interface CollectionFilters {
  factions: string[];   // faction ids — OR semantics (card must be IN the set)
  cost:     number | null; // exact cost match; null = all costs
  keywords: string[];   // keyword ids — AND semantics (card must have ALL)
  search:   string;     // case-insensitive substring: name, subtype, description
}

export function createEmptyFilters(): CollectionFilters {
  return { factions: [], cost: null, keywords: [], search: '' };
}

export function hasActiveFilters(f: CollectionFilters): boolean {
  return (
    f.factions.length > 0 ||
    f.cost !== null ||
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
 *  Within factions the semantics are OR (card belongs to any selected faction).
 *  Within keywords the semantics are AND (card must carry every selected keyword). */
export function applyFilters(
  cards: Card[],
  filters: CollectionFilters,
  keywords: Keyword[],
): Card[] {
  const { factions, cost, keywords: kwIds, search } = filters;
  const q = search.trim().toLowerCase();

  return cards.filter(card => {
    if (factions.length > 0 && !factions.includes(card.faction)) return false;

    if (cost !== null && card.cost !== cost) return false;

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
