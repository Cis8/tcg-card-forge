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
export type RarityShapeName = 'diamond' | 'pentagon' | 'hexagon' | 'circle' | 'shield' | 'star';

export type FrameVariant = 'ornate' | 'classic' | 'inscribed';
export type FontVariant  = 'cinzel' | 'fell' | 'trajan';
export type StatShape    = 'gem' | 'shield' | 'circle';

export interface Card {
  id: string;
  type: CardType;
  name: string;
  subtype: string;
  theme: string;
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

export interface Theme {
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
  statShape: StatShape;
}

// Derived color palette returned by deriveTheme() in color-utils.ts.
// Extends Theme because deriveTheme spreads ...theme into the result.
export interface DerivedTheme extends Theme {
  bg: [string, string, string, string]; // 4-stop gradient stops
  accent: string;
  deep: string;
  parchment: string;
  parchmentShade: string;
  plate: string;
  plateInk: string;
}
