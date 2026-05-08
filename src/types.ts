// types.ts — shared TypeScript interfaces for all TCG data entities.

export type CardType = 'unit' | 'spell';

export type PatternName = 'plain' | 'damask' | 'lattice' | 'rays' | 'scales';

// All glyph keys present in the GLYPHS map (glyphs.tsx).
export type GlyphName =
  | 'flame' | 'frost' | 'leaf' | 'sun' | 'skull'
  | 'bolt' | 'shield' | 'eye' | 'drop' | 'chalice'
  | 'wing' | 'overrun' | 'star' | 'diamond'
  | 'plus' | 'trash' | 'edit' | 'download' | 'upload'
  | 'save' | 'collection' | 'book' | 'palette' | 'gem'
  | 'close' | 'check';

// Renamed from RarityShape to avoid collision with the RarityShape component in glyphs.tsx.
export type RarityShapeName = 'diamond' | 'pentagon' | 'hexagon' | 'circle' | 'shield' | 'star' | 'triangle';

export type FrameVariant = 'ornate' | 'classic' | 'inscribed';
export type FontVariant  = 'cinzel' | 'fell' | 'trajan';
export type StatShape    = 'gem' | 'shield' | 'circle' | 'rhombus' | 'heart';

export interface Card {
  id: string;
  type: CardType;
  name: string;
  subtype: string;
  faction: string;  // was: theme
  pattern: PatternName;
  rarity: string;
  cost: number;
  // Optional: only present for units; spells omit these.
  attack?: number;
  health?: number;
  description: string;
  flavor: string;
  art: string | null; // data URL or null
}

export interface Faction {
  id: string;
  name: string;
  glyph: GlyphName;
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
  glyph: GlyphName;
  color: string;   // hex accent color
  description: string;
}

export interface TweakState {
  frame: FrameVariant;
  font: FontVariant;
  costShape: StatShape;    // shape for cost gem
  attackShape: StatShape;  // shape for attack gem
  healthShape: StatShape;  // shape for health gem
  costColor: string;       // hex rim color for cost gem
  attackColor: string;     // hex rim color for attack gem
  healthColor: string;     // hex rim color for health gem
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
