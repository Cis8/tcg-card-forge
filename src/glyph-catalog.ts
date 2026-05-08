import type { ThematicGlyphName } from './types';

export interface GlyphCatalogSection {
  category: string;
  glyphs: readonly ThematicGlyphName[];
}

export const GLYPH_CATALOG = [
  {
    category: 'Nature',
    glyphs: ['flame', 'frost', 'leaf', 'sun', 'drop', 'vine', 'mountain', 'wave', 'tornado'],
  },
  {
    category: 'Combat',
    glyphs: ['bolt', 'overrun', 'shield', 'sword', 'axe', 'bow', 'spear', 'trident'],
  },
  {
    category: 'Dark',
    glyphs: ['skull', 'eye', 'moon', 'chain', 'rune'],
  },
  {
    category: 'Arcane',
    glyphs: ['star', 'diamond', 'gem', 'chalice', 'orb', 'feather', 'hourglass', 'crown', 'compass'],
  },
  {
    category: 'Creature',
    glyphs: ['wing', 'paw', 'heart'],
  },
] as const satisfies readonly GlyphCatalogSection[];

export const CATALOG_CATEGORIES: string[] = GLYPH_CATALOG.map(s => s.category);
