import type { Faction, Rarity, Keyword, Card, GlyphName, RarityShapeName, PatternName } from './types';

export const DEFAULT_FACTIONS: Faction[] = [
  { id: 'fire',    name: 'Fire',    glyph: 'flame', primary: '#c84a18' },
  { id: 'frost',   name: 'Frost',   glyph: 'frost', primary: '#3d8ec9' },
  { id: 'wild',    name: 'Wild',    glyph: 'leaf',  primary: '#4f8a3a' },
  { id: 'radiant', name: 'Radiant', glyph: 'sun',   primary: '#e1a526' },
  { id: 'umbral',  name: 'Umbral',  glyph: 'skull', primary: '#7a3da8' },
];

export const DEFAULT_RARITIES: Rarity[] = [
  { id: 'common',    name: 'Common',    color: '#a9aeb6', shape: 'diamond'  },
  { id: 'rare',      name: 'Rare',      color: '#3da0e6', shape: 'diamond'  },
  { id: 'epic',      name: 'Epic',      color: '#b466e6', shape: 'pentagon' },
  { id: 'legendary', name: 'Legendary', color: '#f1b637', shape: 'star'     },
];

export const PATTERNS: PatternName[] = ['plain', 'damask', 'lattice', 'rays', 'scales'];

export const FACTION_GLYPH_OPTIONS: GlyphName[] = [
  'flame', 'frost', 'leaf', 'sun', 'skull',
  'bolt', 'shield', 'eye', 'drop', 'chalice', 'wing', 'overrun', 'star', 'diamond',
];

export const RARITY_SHAPE_OPTIONS: RarityShapeName[] = [
  'diamond', 'pentagon', 'hexagon', 'circle', 'shield', 'star', 'triangle',
];

export const DEFAULT_KEYWORDS: Keyword[] = [
  { id: 'k_overrun',    name: 'Overrun',     glyph: 'overrun', color: '#c2410c',
    description: 'Excess damage dealt to a defender carries over to the opponent.' },
  { id: 'k_lastbreath', name: 'Last Breath', glyph: 'skull',   color: '#6b21a8',
    description: 'Triggers the listed effect when this unit is destroyed.' },
  { id: 'k_rush',       name: 'Rush',        glyph: 'bolt',    color: '#b45309',
    description: 'May attack the turn it enters the battlefield.' },
  { id: 'k_guard',      name: 'Guard',       glyph: 'shield',  color: '#1d4ed8',
    description: 'Enemies must attack units with Guard before others.' },
  { id: 'k_stealth',    name: 'Stealth',     glyph: 'eye',     color: '#475569',
    description: 'Cannot be targeted until this unit attacks.' },
  { id: 'k_venom',      name: 'Venom',       glyph: 'drop',    color: '#15803d',
    description: 'Any damage dealt to a unit destroys it.' },
  { id: 'k_drain',      name: 'Drain',       glyph: 'chalice', color: '#9d174d',
    description: 'Damage dealt by this unit also restores your hero.' },
  { id: 'k_flight',     name: 'Flight',      glyph: 'wing',    color: '#0e7490',
    description: 'May only be blocked by units with Flight or Reach.' },
];

export const SEED_CARDS: Card[] = [
  { id: 'seed_1', type: 'unit', name: 'Ashen Warden', subtype: 'Drake · Sentinel',
    faction: 'fire', pattern: 'damask', rarity: 'rare',
    cost: 4, attack: 3, health: 5,
    description: '[Guard]\nWhen this unit attacks, deal 1 damage to all enemy units.',
    flavor: '"Where it lands, the snow forgets it ever fell."',
    art: null },
  { id: 'seed_2', type: 'unit', name: 'Hollow Marchpriest', subtype: 'Undead · Cleric',
    faction: 'umbral', pattern: 'rays', rarity: 'epic',
    cost: 5, attack: 4, health: 4,
    description: '[Last Breath] Summon a 2/2 Wraith with [Stealth].\nAdjacent allies have [Drain].',
    flavor: '', art: null },
  { id: 'seed_3', type: 'spell', name: 'Glacial Verdict', subtype: 'Hex',
    faction: 'frost', pattern: 'lattice', rarity: 'legendary',
    cost: 7,
    description: 'Freeze all enemy units. They lose [Rush] and [Flight] until your next turn.',
    flavor: '"The court has decided. The court is winter."',
    art: null },
];
