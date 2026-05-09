// types.ts — shared TypeScript interfaces for all TCG data entities.

export type CardType = 'unit' | 'spell';

export type PatternName = 'plain' | 'damask' | 'lattice' | 'rays' | 'scales';

// Thematic glyphs — valid choices for Faction.glyph and Keyword.glyph.
export type ThematicGlyphName =
  | 'flame' | 'frost' | 'leaf' | 'sun' | 'skull'
  | 'bolt' | 'shield' | 'eye' | 'drop' | 'chalice'
  | 'wing' | 'overrun' | 'star' | 'diamond' | 'gem'
  | 'sword' | 'axe' | 'bow' | 'spear' | 'trident'
  | 'crown' | 'anchor' | 'hourglass' | 'compass'
  | 'moon' | 'orb' | 'rune' | 'feather'
  | 'paw' | 'vine' | 'mountain' | 'wave' | 'tornado'
  | 'chain' | 'heart'
  | 'blind' | 'vampire' | 'dna' | 'skull-x' | 'bleed';

// UI-only glyphs — not available as faction/keyword choices.
export type UiGlyphName =
  | 'plus' | 'trash' | 'edit' | 'download' | 'upload'
  | 'save' | 'collection' | 'book' | 'palette' | 'close' | 'check' | 'deck';

// Union of all glyph keys present in the GLYPHS map (glyphs.tsx).
export type GlyphName = ThematicGlyphName | UiGlyphName;

// Renamed from RarityShape to avoid collision with the RarityShape component in glyphs.tsx.
export type RarityShapeName = 'diamond' | 'pentagon' | 'hexagon' | 'circle' | 'shield' | 'star' | 'triangle';

export type FrameVariant = 'ornate' | 'classic' | 'inscribed';
export type FontVariant  = 'cinzel' | 'fell' | 'trajan';
export type StatShape    = 'gem' | 'shield' | 'circle' | 'rhombus' | 'heart';

/**
 * Controls the watermark glyph shown in the description text box.
 * - 'faction'            → show the card's faction glyph (default)
 * - 'none'               → no watermark
 * - ThematicGlyphName    → a specific glyph
 */
export type DescGlyph = 'none' | 'faction' | ThematicGlyphName;

export interface Card {
  id: string;
  type: CardType;
  name: string;
  subtype: string;
  faction: string;  // was: theme
  pattern: PatternName;
  rarity: string;
  frame: FrameVariant; // card-specific border style
  cost: number;
  // Optional: only present for units; spells omit these.
  attack?: number;
  health?: number;
  description: string;
  flavor: string;
  artId: string | null; // references a StoredImage.id in IndexedDB
  /** Custom hex color for the description text-box background. null = use faction parchment. */
  descBg?: string | null;
  /** Watermark glyph shown behind the description text. Defaults to 'faction'. */
  descGlyph?: DescGlyph;
}

/** Binary image stored in IndexedDB. Content-addressed by SHA-256 hash. */
export interface StoredImage {
  id: string;       // SHA-256 hex, first 40 chars
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  refCount: number; // number of cards referencing this image; 0 = eligible for GC
}

/** Resolved image handle — carries a live Object URL valid for the session. */
export interface ImageHandle {
  id: string;
  objectUrl: string;
  width: number;
  height: number;
}

/** Card with its image already resolved — used throughout React state and UI components. */
export interface CardWithArt extends Card {
  artHandle: ImageHandle | null;
}

/** Card shape used in exported JSON — art embedded as base64 for portability. */
export type CardExport = Omit<Card, 'artId'> & {
  art: string | null; // base64 data URL
};

export interface Faction {
  id: string;
  name: string;
  glyph: ThematicGlyphName;
  primary: string; // hex color
}

export interface Rarity {
  id: string;
  name: string;
  color: string;          // hex color for rarity gem
  shape: RarityShapeName;
}

export interface Keyword {
  id: string;
  name: string;
  glyph: ThematicGlyphName;
  color: string;   // hex accent color
  description: string;
}

/** Settings that apply globally to every card in the collection. */
export interface GlobalSettings {
  font: FontVariant;
  costShape: StatShape;    // shape for cost gem
  attackShape: StatShape;  // shape for attack gem
  healthShape: StatShape;  // shape for health gem
  costColor: string;       // hex rim color for cost gem
  attackColor: string;     // hex rim color for attack gem
  healthColor: string;     // hex rim color for health gem
  deckSettings: DeckSettings;
}

/** Gameplay rules applying to all decks. Nested inside GlobalSettings. */
export interface DeckSettings {
  maxCopiesPerCard: number; // default 4
  minDeckSize: number;      // default 20
  maxDeckSize: number;      // default 60
}

/** A single card entry in a deck (card id + quantity). */
export interface DeckEntry {
  cardId: string;
  quantity: number;
}

/** A named deck of cards. */
export interface Deck {
  id: string;
  name: string;
  description: string;
  entries: DeckEntry[];
}

/** Full application snapshot — version 4. Used for JSON export/import. */
export interface AppSnapshot {
  version: 4;
  exportedAt: string;
  globalSettings: GlobalSettings;
  cards: CardExport[];   // art embedded as base64
  keywords: Keyword[];
  factions: Faction[];
  rarities: Rarity[];
  decks: Deck[];
}

// Derived color palette returned by deriveFaction() in color-utils.ts.
// Extends Faction because deriveFaction spreads ...faction into the result.
export interface DerivedFaction extends Faction {
  bg: [string, string, string, string]; // 4-stop gradient stops
  accent: string;
  deep: string;
  parchment: string;
  parchmentShade: string;
  plate: string;
  plateInk: string;
}
