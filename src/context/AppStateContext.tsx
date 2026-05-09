import React, { createContext, useContext } from 'react';
import type { CardWithArt, Deck, Faction, Rarity, Keyword, GlobalSettings, ImageHandle } from '../types';

export interface AppState {
  cards: CardWithArt[];
  cardMap: Map<string, CardWithArt>;
  current: CardWithArt;
  decks: Deck[];
  factions: Faction[];
  rarities: Rarity[];
  keywords: Keyword[];
  globalSettings: GlobalSettings;
}

export type AppAction =
  | { type: 'LOADED'; payload: Omit<AppState, 'cardMap'> }
  | { type: 'SET_CURRENT'; payload: CardWithArt }
  | { type: 'CARD_SAVED'; payload: CardWithArt }
  | { type: 'CARD_DELETED'; payload: { id: string } }
  | { type: 'ART_RESOLVED'; payload: { cardId: string; handle: ImageHandle } }
  | { type: 'FACTIONS_CHANGED'; payload: Faction[] }
  | { type: 'RARITIES_CHANGED'; payload: Rarity[] }
  | { type: 'KEYWORDS_CHANGED'; payload: Keyword[] }
  | { type: 'GLOBAL_SETTINGS_CHANGED'; payload: GlobalSettings }
  | { type: 'DECKS_CHANGED'; payload: Deck[] };

function buildCardMap(cards: CardWithArt[]): Map<string, CardWithArt> {
  return new Map(cards.map(c => [c.id, c]));
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOADED': {
      const cards = action.payload.cards;
      return { ...action.payload, cardMap: buildCardMap(cards) };
    }
    case 'SET_CURRENT':
      return { ...state, current: action.payload };
    case 'CARD_SAVED': {
      const card = action.payload;
      const exists = state.cards.some(c => c.id === card.id);
      const cards = exists
        ? state.cards.map(c => (c.id === card.id ? card : c))
        : [...state.cards, card];
      return { ...state, cards, cardMap: buildCardMap(cards) };
    }
    case 'CARD_DELETED': {
      const cards = state.cards.filter(c => c.id !== action.payload.id);
      return { ...state, cards, cardMap: buildCardMap(cards) };
    }
    case 'ART_RESOLVED': {
      const { cardId, handle } = action.payload;
      const cards = state.cards.map(c =>
        c.id === cardId ? { ...c, artHandle: handle } : c,
      );
      const current =
        state.current.id === cardId
          ? { ...state.current, artHandle: handle }
          : state.current;
      return { ...state, cards, cardMap: buildCardMap(cards), current };
    }
    case 'FACTIONS_CHANGED':
      return { ...state, factions: action.payload };
    case 'RARITIES_CHANGED':
      return { ...state, rarities: action.payload };
    case 'KEYWORDS_CHANGED':
      return { ...state, keywords: action.payload };
    case 'GLOBAL_SETTINGS_CHANGED':
      return { ...state, globalSettings: action.payload };
    case 'DECKS_CHANGED':
      return { ...state, decks: action.payload };
    default:
      return state;
  }
}

export const AppStateContext    = createContext<AppState | null>(null);
export const AppDispatchContext = createContext<React.Dispatch<AppAction> | null>(null);

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be called inside AppStateContext.Provider');
  return ctx;
}

export function useAppDispatch(): React.Dispatch<AppAction> {
  const ctx = useContext(AppDispatchContext);
  if (!ctx) throw new Error('useAppDispatch must be called inside AppDispatchContext.Provider');
  return ctx;
}
