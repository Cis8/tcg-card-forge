import React, { useId } from 'react';
import type { GlyphName, RarityShapeName } from './types';
import { deriveRarityDeep } from './color-utils';

interface GlyphProps {
  name: GlyphName | string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  title?: string;
}

export const Glyph = ({ name, size = 16, color, style, title }: GlyphProps): React.ReactElement | null => {
  const C = GLYPHS[name as GlyphName];
  if (!C) return null;
  return (
    <span aria-label={title || name} role="img"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size, color: color || 'currentColor',
        ...style,
      }}>
      <C />
    </span>
  );
};

export const GLYPHS: Record<GlyphName, () => React.ReactElement> = {
  flame: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M12 2c.6 3.5-2.2 5.4-3.4 7.6-1.8 3.2-1 6.6 1.5 8.5-.8-2.4.4-4 1.6-5 .1 2 1 3.2 2.7 4.2 1.7 1 2.6 2.6 2.4 4.6 3.5-2.4 4.7-7 2.4-10.5-1.4-2-3-3-3.7-5.5-.5-1.8-2-3-3.5-3.9z"/>
    </svg>
  ),
  frost: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round">
      <path d="M12 2v20M3.5 7l17 10M3.5 17l17-10"/>
      <path d="M9 4l3 2 3-2M9 20l3-2 3 2M5 9l-1 3 1 3M19 9l1 3-1 3"/>
    </svg>
  ),
  leaf: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M20 3c-7 0-14 3-14 11 0 1.6.5 3 1.3 4.2L4 21.7l1.4 1.4 3.4-3.4c1.3.8 2.7 1.3 4.2 1.3 8 0 11-7 11-14 0-1.4 0-3 0-4z"/>
    </svg>
  ),
  sun: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <circle cx="12" cy="12" r="4.5"/>
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="1.5" x2="12" y2="4.5"/><line x1="12" y1="19.5" x2="12" y2="22.5"/>
        <line x1="1.5" y1="12" x2="4.5" y2="12"/><line x1="19.5" y1="12" x2="22.5" y2="12"/>
        <line x1="4.4" y1="4.4" x2="6.6" y2="6.6"/><line x1="17.4" y1="17.4" x2="19.6" y2="19.6"/>
        <line x1="4.4" y1="19.6" x2="6.6" y2="17.4"/><line x1="17.4" y1="6.6" x2="19.6" y2="4.4"/>
      </g>
    </svg>
  ),
  skull: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M12 2.2c-4.7 0-8.4 3.4-8.4 7.7 0 2.5 1.2 4.6 3 6v3.3c0 .8.6 1.4 1.4 1.4h.7v1.6c0 .4.3.7.7.7s.7-.3.7-.7v-1.6h3.8v1.6c0 .4.3.7.7.7s.7-.3.7-.7v-1.6h.7c.8 0 1.4-.6 1.4-1.4v-3.3c1.8-1.4 3-3.5 3-6 0-4.3-3.7-7.7-8.4-7.7zm-3.3 8.5a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4zm6.6 0a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4zM10 16.4h4l-.5 1.6h-3l-.5-1.6z"/>
    </svg>
  ),
  overrun: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M3 12l5-5v3h6V7l5 5-5 5v-3H8v3l-5-5z"/>
    </svg>
  ),
  bolt: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M14 2L4 13h6l-1 9 11-13h-7l1-7z"/>
    </svg>
  ),
  shield: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M12 2L3 5v6c0 5.5 3.8 10.4 9 11.5 5.2-1.1 9-6 9-11.5V5l-9-3z"/>
    </svg>
  ),
  eye: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M12 5C6 5 2 12 2 12s4 7 10 7 10-7 10-7-4-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/>
      <circle cx="12" cy="12" r="2" fill="#fff"/>
    </svg>
  ),
  drop: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M12 2.5c-3.5 5-7 8.5-7 12.5a7 7 0 0 0 14 0c0-4-3.5-7.5-7-12.5z"/>
    </svg>
  ),
  chalice: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M5 4h14l-1 5a6 6 0 0 1-5 5.9V19h3v2H8v-2h3v-4.1A6 6 0 0 1 6 9L5 4z"/>
    </svg>
  ),
  wing: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor"
         strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 17.5c.7-6.8 4.8-11.3 12.2-13.5 1.7 4.7 1 8.7-2.1 12-2.6 2.6-6 4-10.1 4.2z"/>
      <path d="M7.1 16.2c2.5-1.4 5.1-4.3 7.2-8.5"/>
      <path d="M9.8 17.8c1.8-1 3.9-2.8 5.8-5.5"/>
      <path d="M12.8 18.5c1-.6 2.2-1.6 3.4-3.2"/>
    </svg>
  ),
  star: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <polygon points="12,2 14.4,9.2 22,9.2 15.8,13.7 18.2,21 12,16.4 5.8,21 8.2,13.7 2,9.2 9.6,9.2"/>
    </svg>
  ),
  diamond: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <polygon points="12,2 22,12 12,22 2,12"/>
    </svg>
  ),
  plus: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  trash: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm-3 6h12l-1 12H7L6 9zm3 2v8h2v-8H9zm4 0v8h2v-8h-2z"/>
    </svg>
  ),
  edit: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M3 17.2V21h3.8L18 9.8 14.2 6 3 17.2zm17.4-12.6a1.4 1.4 0 0 0 0-2L18.4.6a1.4 1.4 0 0 0-2 0L15 2l3.8 3.8 1.6-1.2z"/>
    </svg>
  ),
  download: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12m0 0l-5-5m5 5l5-5M4 19h16"/>
    </svg>
  ),
  upload: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21V9m0 0l-5 5m5-5l5 5M4 5h16"/>
    </svg>
  ),
  save: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3h11l3 3v15H5z"/>
      <path d="M8 3v6h8V3M8 14h8v7H8z"/>
    </svg>
  ),
  collection: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1"/>
      <rect x="14" y="3" width="7" height="14" rx="1"/>
      <rect x="3" y="15" width="7" height="6" rx="1"/>
    </svg>
  ),
  book: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h12a3 3 0 0 1 3 3v14H7a3 3 0 0 1-3-3V4z"/>
      <path d="M4 18a3 3 0 0 1 3-3h12"/>
    </svg>
  ),
  palette: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 0 0 0 20c1.5 0 2-1 2-2 0-.5-.3-.8-.3-1.4 0-.6.4-1 1-1H17a5 5 0 0 0 5-5c0-5.5-4.5-10-10-10z"/>
      <circle cx="7" cy="11" r="1.2" fill="currentColor"/>
      <circle cx="11" cy="7" r="1.2" fill="currentColor"/>
      <circle cx="16" cy="9" r="1.2" fill="currentColor"/>
    </svg>
  ),
  gem: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <polygon points="6,2 18,2 22,9 12,22 2,9"/>
    </svg>
  ),
  close: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M5 5l14 14M19 5L5 19"/>
    </svg>
  ),
  check: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L19 7"/>
    </svg>
  ),

  // ── Thematic additions ─────────────────────────────────────────────
  sword: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="4" y1="20" x2="20" y2="4"/>
      <line x1="8" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  axe: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 20.5L16.8 4.2"/>
      <path d="M14.2 5c3.1-1.8 5.8-1.9 7.9-.5-.1 4.5-2.7 7.6-7.8 9.2l-3.2-3.1c.6-2.1 1.6-4 3.1-5.6z"
            fill="currentColor" stroke="none"/>
      <path d="M7.2 18.8l2.4 2.4"/>
    </svg>
  ),
  bow: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor"
         strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3C4.6 5.7 3 8.7 3 12s1.6 6.3 5 9"/>
      <path d="M8 3L11.8 12 8 21"/>
      <line x1="11.8" y1="12" x2="20.5" y2="12"/>
      <path d="M17.4 9.5l3.1 2.5-3.1 2.5"/>
      <path d="M12.7 10.2L10.8 12l1.9 1.8"/>
    </svg>
  ),
  spear: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M12 2l-4 9h3v11h2V11h3z"/>
    </svg>
  ),
  trident: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="22"/>
      <path d="M9 2v7l3-4 3 4V2"/>
      <line x1="9" y1="11" x2="15" y2="11"/>
    </svg>
  ),
  crown: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M2 18L5 9l4 4 3-8 3 8 4-4 3 9H2z"/>
      <rect x="2" y="19" width="20" height="3" rx="1"/>
    </svg>
  ),
  anchor: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="6" r="3"/>
      <line x1="12" y1="9" x2="12" y2="21"/>
      <line x1="5" y1="14" x2="19" y2="14"/>
      <path d="M5 14c0 3 3 7 7 7s7-4 7-7"/>
    </svg>
  ),
  hourglass: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M5 3h14v4.5L12 12l7 4.5V21H5v-4.5L12 12 5 7.5V3zm2 1.5v2.4L12 11l5-4.1V4.5H7zm0 15h10v-2.4L12 13l-5 4.1v2.4z"/>
    </svg>
  ),
  compass: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="currentColor" stroke="none"/>
    </svg>
  ),
  moon: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  orb: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9"/>
      <ellipse cx="12" cy="12" rx="4.5" ry="9" strokeWidth="1" strokeDasharray="3 2"/>
      <line x1="3" y1="12" x2="21" y2="12" strokeWidth="1" strokeDasharray="3 2"/>
    </svg>
  ),
  rune: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="3" x2="12" y2="21"/>
      <path d="M9 9l3-6 3 6"/>
      <path d="M7 16l5-3 5 3"/>
    </svg>
  ),
  feather: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
      <line x1="16" y1="8" x2="2" y2="22"/>
      <line x1="17" y1="15" x2="9" y2="15"/>
    </svg>
  ),
  paw: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <circle cx="6.5" cy="7.5" r="2.5"/>
      <circle cx="12" cy="5.5" r="2.5"/>
      <circle cx="17.5" cy="7.5" r="2.5"/>
      <path d="M12 20c-3 0-6-2-6-5s2-4 6-4 6 1 6 4-3 5-6 5z"/>
    </svg>
  ),
  vine: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 22V2"/>
      <path d="M12 8C10 4 6 5 5 8"/>
      <path d="M12 14C14 10 18 11 19 14"/>
      <path d="M12 18C10 15 7 16 6 18"/>
    </svg>
  ),
  mountain: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 21L9 7l4 5 3-4 6 13H2z"/>
    </svg>
  ),
  wave: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M2 11c1.5-4 3.5-4 5 0s3.5 4 5 0 3.5-4 5 0"/>
      <path d="M2 16c1.5-4 3.5-4 5 0s3.5 4 5 0 3.5-4 5 0" strokeWidth="1.5" strokeOpacity="0.5"/>
    </svg>
  ),
  tornado: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="5" x2="21" y2="5"/>
      <line x1="5" y1="10" x2="19" y2="10"/>
      <line x1="8" y1="15" x2="16" y2="15"/>
      <line x1="11" y1="20" x2="13" y2="20"/>
    </svg>
  ),
  chain: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  heart: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ),

  // eye with diagonal bar = blinded / silenced
  blind: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M12 5C6 5 2 12 2 12s4 7 10 7 10-7 10-7-4-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/>
      <circle cx="12" cy="12" r="2"/>
      <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),

  // predator fang
  fang: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor"
         strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.2 3.5C18.6 4.6 21 7.7 21 11c0 3-1.4 5.9-3.9 8.1L12 22l-1.1-6.6c-.5-2.9.2-5.9 2-8.2.6-.9 1.4-1.6 2.3-2.2z"/>
      <path d="M15.1 7.2c-1.7 2.2-2.6 4.8-2.4 7.7"/>
    </svg>
  ),

  // DNA double helix
  dna: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor"
         strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3C7 6.5 17 7.5 17 12c0 4.5-10 5.5-10 9"/>
      <path d="M17 3c0 3.5-10 4.5-10 9 0 4.5 10 5.5 10 9"/>
      <path d="M9 5.5h6"/>
      <path d="M7.6 9.3h8.8"/>
      <path d="M7.6 14.7h8.8"/>
      <path d="M9 18.5h6"/>
    </svg>
  ),

  // skull with X eyes = kill / death mark
  'skull-x': () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      {/* skull silhouette without eye holes */}
      <path d="M12 2.2c-4.7 0-8.4 3.4-8.4 7.7 0 2.5 1.2 4.6 3 6v3.3c0 .8.6 1.4 1.4 1.4h.7v1.6c0 .4.3.7.7.7s.7-.3.7-.7v-1.6h3.8v1.6c0 .4.3.7.7.7s.7-.3.7-.7v-1.6h.7c.8 0 1.4-.6 1.4-1.4v-3.3c1.8-1.4 3-3.5 3-6 0-4.3-3.7-7.7-8.4-7.7z"/>
      <path d="M10 16.4h4l-.5 1.6h-3l-.5-1.6z" fill="#0008"/>
      {/* X left eye, center ~(8.7, 12.4) */}
      <line x1="7" y1="10.8" x2="10.4" y2="14.2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="10.4" y1="10.8" x2="7" y2="14.2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
      {/* X right eye, center ~(15.3, 12.4) */}
      <line x1="13.6" y1="10.8" x2="17" y2="14.2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="17" y1="10.8" x2="13.6" y2="14.2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),

  // bleeding — drop with drips below
  bleed: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      {/* main blood drop */}
      <path d="M12 3c-2.5 3.5-6 7-6 10a6 6 0 0 0 12 0c0-3-3.5-6.5-6-10z"/>
      {/* drips */}
      <line x1="9" y1="19" x2="8" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="15" y1="19" x2="16" y2="22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
};

interface CornerFlourishProps {
  side?: 'tl' | 'tr' | 'br' | 'bl';
  color?: string;
}

export const CornerFlourish = ({ side = 'tl', color = '#caa14b' }: CornerFlourishProps): React.ReactElement => {
  const transformMap: Record<string, string> = {
    tl: 'none',
    tr: 'scaleX(-1)',
    bl: 'scaleY(-1)',
    br: 'scale(-1,-1)',
  };
  const xform = transformMap[side] ?? 'none';
  return (
    <svg viewBox="0 0 40 40" width="100%" height="100%"
         overflow="hidden"
         style={{ transform: xform, transformOrigin: '50% 50%', transformBox: 'fill-box' }}>
      <g fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" opacity=".78">
        <path d="M2 8 Q 8 8 8 14 Q 8 20 14 20"/>
        <path d="M5 14 Q 12 14 12 22"/>
        <path d="M14 2 Q 14 6 18 8"/>
        <path d="M20 2 Q 20 6 24 8"/>
      </g>
    </svg>
  );
};

interface ShapeDef {
  tag: 'polygon' | 'circle' | 'path';
  attrs: Record<string, string | number>;
}

export const SHAPE_PATHS: Record<RarityShapeName, ShapeDef> = {
  diamond:  { tag: 'polygon', attrs: { points: '12,2 22,12 12,22 2,12' } },
  pentagon: { tag: 'polygon', attrs: { points: '12,2 22,9.5 18.2,21 5.8,21 2,9.5' } },
  hexagon:  { tag: 'polygon', attrs: { points: '6.5,3 17.5,3 22,12 17.5,21 6.5,21 2,12' } },
  circle:   { tag: 'circle',  attrs: { cx: 12, cy: 12, r: 10 } },
  shield:   { tag: 'path',    attrs: { d: 'M12 2 L21 5 V12 C21 18 17 21 12 22 C7 21 3 18 3 12 V5 Z' } },
  star:     { tag: 'polygon', attrs: { points: '12,2 14.4,9.2 22,9.2 15.8,13.7 18.2,21 12,16.4 5.8,21 8.2,13.7 2,9.2 9.6,9.2' } },
  triangle: { tag: 'polygon', attrs: { points: '12,2 22,22 2,22' } },
};

interface RarityShapeProps {
  shape?: RarityShapeName;
  color?: string;
  size?: number;
}

export function RarityShape({ shape = 'diamond', color = '#a9aeb6', size = 22 }: RarityShapeProps): React.ReactElement {
  const deep = deriveRarityDeep(color);
  const uid = useId();
  const gid = `g-${uid}`;
  const def = SHAPE_PATHS[shape] ?? SHAPE_PATHS.diamond;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}
         style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.6))', display: 'block' }}>
      <defs>
        <radialGradient id={gid} cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fff" stopOpacity=".95"/>
          <stop offset="55%" stopColor={color}/>
          <stop offset="100%" stopColor={deep}/>
        </radialGradient>
      </defs>
      {React.createElement(def.tag, {
        ...def.attrs,
        fill: `url(#${gid})`,
        stroke: '#1a1306',
        strokeWidth: 1,
      })}
    </svg>
  );
}
