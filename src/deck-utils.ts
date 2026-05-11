// deck-utils.ts — pure helpers for deck management. No React, no side effects.

import type { Card, Deck, DeckEntry, DeckSettings, Faction } from './types';

export const DECK_SETTINGS_DEFAULTS: DeckSettings = {
  maxCopiesPerCard: 4,
  minDeckSize: 20,
  maxDeckSize: 60,
};

/** Generate a unique id with a given prefix. */
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function toFiniteInt(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
}

/**
 * Normalize DeckSettings: clamp values to valid ranges, handle missing/non-numeric fields.
 * Ensures minDeckSize <= maxDeckSize.
 */
export function normalizeDeckSettings(raw: Partial<DeckSettings> | null | undefined): DeckSettings {
  const src = raw ?? {};
  const maxCopies = Math.max(1, Math.min(10, toFiniteInt(src.maxCopiesPerCard, DECK_SETTINGS_DEFAULTS.maxCopiesPerCard)));
  const minDeck   = Math.max(1, Math.min(200, toFiniteInt(src.minDeckSize,       DECK_SETTINGS_DEFAULTS.minDeckSize)));
  const maxDeck   = Math.max(minDeck, Math.min(200, toFiniteInt(src.maxDeckSize, DECK_SETTINGS_DEFAULTS.maxDeckSize)));
  return { maxCopiesPerCard: maxCopies, minDeckSize: minDeck, maxDeckSize: maxDeck };
}

/** Create a new empty deck with a generated id. */
export function createDeck(name = 'New Deck'): Deck {
  return { id: generateId('d'), name, description: '', entries: [] };
}

/**
 * Enforce deck invariants:
 * - One entry per cardId (deduplicate by taking max quantity if somehow duplicated)
 * - quantity >= 1
 * - quantity <= settings.maxCopiesPerCard
 * - Remove entries for card ids not in the provided validCardIds set
 * Defensive: handles missing/malformed entries array.
 */
export function normalizeDeck(deck: Deck, validCardIds: Set<string>, settings: DeckSettings): Deck {
  const raw = Array.isArray(deck.entries) ? deck.entries : [];
  const seen = new Map<string, number>();
  for (const e of raw) {
    if (typeof e.cardId !== 'string' || !validCardIds.has(e.cardId)) continue;
    const qty = typeof e.quantity === 'number' ? e.quantity : 0;
    seen.set(e.cardId, Math.max(seen.get(e.cardId) ?? 0, qty));
  }
  const entries: DeckEntry[] = [];
  for (const [cardId, qty] of seen) {
    entries.push({ cardId, quantity: Math.max(1, Math.min(settings.maxCopiesPerCard, qty)) });
  }
  return { ...deck, entries };
}

/** Add one copy of a card to the deck (up to maxCopiesPerCard). Returns new deck. */
export function addCardToDeck(deck: Deck, cardId: string, settings: DeckSettings): Deck {
  const existing = deck.entries.find(e => e.cardId === cardId);
  if (existing) {
    if (existing.quantity >= settings.maxCopiesPerCard) return deck;
    return {
      ...deck,
      entries: deck.entries.map(e =>
        e.cardId === cardId ? { ...e, quantity: e.quantity + 1 } : e
      ),
    };
  }
  return { ...deck, entries: [...deck.entries, { cardId, quantity: 1 }] };
}

/** Remove one copy of a card. If quantity reaches 0, remove the entry. */
export function removeCardFromDeck(deck: Deck, cardId: string): Deck {
  return {
    ...deck,
    entries: deck.entries
      .map(e => e.cardId === cardId ? { ...e, quantity: e.quantity - 1 } : e)
      .filter(e => e.quantity > 0),
  };
}

/** Set exact quantity for a card. Quantity <= 0 removes the entry. */
export function setCardQuantity(deck: Deck, cardId: string, qty: number, settings: DeckSettings): Deck {
  const clamped = Math.max(0, Math.min(settings.maxCopiesPerCard, qty));
  if (clamped === 0) {
    return { ...deck, entries: deck.entries.filter(e => e.cardId !== cardId) };
  }
  const existing = deck.entries.find(e => e.cardId === cardId);
  if (existing) {
    return {
      ...deck,
      entries: deck.entries.map(e => e.cardId === cardId ? { ...e, quantity: clamped } : e),
    };
  }
  return { ...deck, entries: [...deck.entries, { cardId, quantity: clamped }] };
}

/** Remove all entries referencing the deleted cardId from all decks. */
export function deleteCardFromDecks(decks: Deck[], cardId: string): Deck[] {
  return decks.map(d => ({
    ...d,
    entries: d.entries.filter(e => e.cardId !== cardId),
  }));
}

/** Returns names of decks that contain a given cardId. */
export function affectedDeckNames(decks: Deck[], cardId: string): string[] {
  return decks.filter(d => d.entries.some(e => e.cardId === cardId)).map(d => d.name);
}

/** Sort cards by cost ascending; Token cards (rarity === undefined) go last. */
export function sortCardsByCost<T extends Card>(cards: T[]): T[] {
  return [...cards].sort((a, b) => {
    const aToken = a.rarity == null;
    const bToken = b.rarity == null;
    if (aToken !== bToken) return aToken ? 1 : -1;
    return a.cost - b.cost;
  });
}

/** Total card count (sum of all quantities). */
export function getDeckTotal(deck: Deck): number {
  return deck.entries.reduce((sum, e) => sum + e.quantity, 0);
}

/**
 * Unique factions in this deck, derived from card data.
 * Order: by first appearance in deck.entries.
 */
export function getDeckFactions(deck: Deck, cards: Card[], factions: Faction[]): Faction[] {
  const seen = new Set<string>();
  const result: Faction[] = [];
  for (const entry of deck.entries) {
    const card = cards.find(c => c.id === entry.cardId);
    if (!card || seen.has(card.faction)) continue;
    const faction = factions.find(f => f.id === card.faction);
    if (faction) { seen.add(card.faction); result.push(faction); }
  }
  return result;
}

/**
 * Cost curve: map from mana cost to total card count at that cost.
 * Costs >= 10 are bucketed under 10.
 */
export function getDeckCostCurve(deck: Deck, cards: Card[]): Map<number, number> {
  const curve = new Map<number, number>();
  for (const entry of deck.entries) {
    const card = cards.find(c => c.id === entry.cardId);
    if (!card) continue;
    const bucket = Math.min(card.cost ?? 0, 10);
    curve.set(bucket, (curve.get(bucket) ?? 0) + entry.quantity);
  }
  return curve;
}

export type DeckIssueKind = 'under_min' | 'over_max' | 'over_copies' | 'missing_card';

export interface DeckIssue {
  kind: DeckIssueKind;
  message: string;
  cardId?: string;
}

/** Validate a deck against current settings and card collection. */
export function validateDeck(deck: Deck, cards: Card[], settings: DeckSettings): DeckIssue[] {
  const issues: DeckIssue[] = [];
  const total = getDeckTotal(deck);
  const cardIds = new Set(cards.map(c => c.id));

  if (total < settings.minDeckSize) {
    issues.push({ kind: 'under_min', message: `Deck has ${total} cards; minimum is ${settings.minDeckSize}.` });
  }
  if (total > settings.maxDeckSize) {
    issues.push({ kind: 'over_max', message: `Deck has ${total} cards; maximum is ${settings.maxDeckSize}.` });
  }
  for (const e of deck.entries) {
    if (!cardIds.has(e.cardId)) {
      issues.push({ kind: 'missing_card', message: `Card ${e.cardId} is not in the collection.`, cardId: e.cardId });
    } else if (e.quantity > settings.maxCopiesPerCard) {
      const card = cards.find(c => c.id === e.cardId);
      issues.push({
        kind: 'over_copies',
        message: `"${card?.name ?? e.cardId}" has ${e.quantity} copies; max is ${settings.maxCopiesPerCard}.`,
        cardId: e.cardId,
      });
    }
  }
  return issues;
}
