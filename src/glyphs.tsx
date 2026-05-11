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
  const normalizedName = name === 'fang' ? 'vampire' : name;
  const displayName = normalizedName;
  const C = GLYPHS[normalizedName as GlyphName];
  if (!C) return null;
  return (
    <span aria-label={title || displayName} role="img"
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
  // wing — powerful feathered angelic wing for flight
  wing: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      {/* Il Path è stato completamente ridisegnato per creare un'ala d'angelo stilizzata.
        1. Una forte curva superiore definisce la struttura portante ("braccio" dell'ala).
        2. Una serie di curve più piccole e definite (piume fustellate) creano la trama inferiore.
      */}
      <path d="M4,16 C6,8 14,3 20,4 C18,6 16,9 17,12 C16.1,12.9 15.7,13.2 15.5,13.5 A1.5,1.5 0,0,1 12.5,15.5 A1.5,1.5 0,0,1 9.5,17.5 A1.5,1.5 0,0,1 6.5,19.5 C5.5,19.5 4,18 4,16 Z" />
    </svg>
  ),
  star: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <polygon points="12,2 14.4,9.2 22,9.2 15.8,13.7 18.2,21 12,16.4 5.8,21 8.2,13.7 2,9.2 9.6,9.2"/>
    </svg>
  ),
  gem: () => (
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
  diamond: () => (
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
  deck: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="9" width="13" height="11" rx="1.5" transform="rotate(-6 3 9)"/>
      <rect x="5" y="7" width="13" height="11" rx="1.5"/>
      <rect x="8" y="4" width="13" height="11" rx="1.5" transform="rotate(6 8 4)"/>
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
    </svg>
  ),
  bow: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor"
         strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.3 4.2c4.7 3.3 4.7 12.3 0 15.6"/>
      <path d="M8.3 4.2v15.6"/>
      <path d="M5 12h12.6"/>
      <path d="M14 9.6l3.6 2.4-3.6 2.4"/>
      <path d="M8.3 12h1.8"/>
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
  // crown — regal crown with straight vertical outer edges
  crown: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      {/* La base della corona: i lati (M4 18 a L4 10 e L20 10 a L20 18) ora sono perfettamente verticali.
          Le valli interne scendono simmetricamente a X=8 e X=16. */}
      <path d="M4 18 L4 10 L8 14 L12 4 L16 14 L20 10 L20 18 Z"/>
      
      {/* La fascia di base inferiore, inalterata per dare peso e stabilità */}
      <rect x="2" y="18" width="20" height="3.5" rx="1"/>
      
      {/* Sfere decorative: le due laterali sono state traslate esternamente (da X=5 a X=4 e da X=19 a X=20) 
          per centrarle perfettamente sulle nuove punte verticali */}
      <circle cx="4" cy="9" r="1.8"/>
      <circle cx="12" cy="3.5" r="1.8"/>
      <circle cx="20" cy="9" r="1.8"/>
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

  // vampire — aggressive upper jaw with prominent fangs and a snarling gumline
  vampire: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
    <path d="M 2 10 C 7 4, 10 9, 12 9 C 14 9, 17 4, 22 10 L 20 12 L 17 22 L 15 13 L 13 16 L 12 13 L 11 16 L 9 13 L 7 22 L 4 12 Z"/>
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

  // bleeding — dynamic diagonal slash with anatomically correct blood drops
  bleed: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      {/* Il Taglio: Forma a sciabolata/artiglio, più spessa al centro e affilata alle estremità */}
      <path d="M 21 3 C 21 3 14 5.5 6 15 C 4.5 16.8 3 19 3 19 C 3 19 5.8 17.8 8.5 16 C 14.5 12.5 19.5 6.5 21 3 Z" />
      
      {/* Goccia Grande: Cade dalla parte inferiore del taglio */}
      <path d="M 10 16 C 10 16 7.5 19 7.5 21 A 2.5 2.5 0 0 0 12.5 21 C 12.5 19 10 16 10 16 Z" />
      
      {/* Goccia Piccola: Leggermente sfalsata in alto a destra */}
      <path d="M 16 12 C 16 12 14.5 14.5 14.5 16 A 1.5 1.5 0 0 0 17.5 16 C 17.5 14.5 16 12 16 12 Z" />
    </svg>
  ),
  // — virus: spherical body with radiating spike proteins
  virus: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      {/* Corpo centrale sferico */}
      <circle cx="12" cy="12" r="5" />
      
      {/* 8 proteine Spike radiali: una combinazione di stelo (L) e testa a "T" capovolta (C) */}
      {/* In alto (12:00) */}
      <path d="M 11.5 2 V 7 H 12.5 V 2 H 14.5 C 14.5 1.2 13.8 0.5 13 0.5 H 11 C 10.2 0.5 9.5 1.2 9.5 2 Z" />
      {/* In basso (6:00) */}
      <path d="M 11.5 22 V 17 H 12.5 V 22 H 14.5 C 14.5 22.8 13.8 23.5 13 23.5 H 11 C 10.2 23.5 9.5 22.8 9.5 22 Z" />
      {/* A destra (3:00) */}
      <path d="M 22 11.5 H 17 V 12.5 H 22 V 14.5 C 22.8 14.5 23.5 13.8 23.5 13 V 11 C 23.5 10.2 22.8 9.5 22 9.5 Z" />
      {/* A sinistra (9:00) */}
      <path d="M 2 11.5 H 7 V 12.5 H 2 V 14.5 C 1.2 14.5 0.5 13.8 0.5 13 V 11 C 0.5 10.2 1.2 9.5 2 9.5 Z" />
      
      {/* 4 Spike diagonali (ruotati di 45°) per completezza */}
      <path d="M 5 19 L 8.5 15.5 L 9.2 16.2 L 5.7 19.7 C 6.3 20.3 6.3 21.3 5.7 21.9 C 5.1 22.5 4.1 22.5 3.5 21.9 L 2.1 20.5 C 1.5 19.9 1.5 18.9 2.1 18.3 C 2.7 17.7 3.7 17.7 4.3 18.3 Z" />
      <path d="M 19 5 L 15.5 8.5 L 14.8 7.8 L 18.3 4.3 C 17.7 3.7 17.7 2.7 18.3 2.1 C 18.9 1.5 19.9 1.5 20.5 2.1 L 21.9 3.5 C 22.5 4.1 22.5 5.1 21.9 5.7 C 21.3 6.3 20.3 6.3 19.7 5.7 Z" />
      <path d="M 5 5 L 8.5 8.5 L 7.8 9.2 L 4.3 5.7 C 3.7 6.3 2.7 6.3 2.1 5.7 C 1.5 5.1 1.5 4.1 2.1 3.5 L 3.5 2.1 C 4.1 1.5 5.1 1.5 5.7 2.1 C 6.3 2.7 6.3 3.7 5.7 4.3 Z" />
      <path d="M 19 19 L 15.5 15.5 L 16.2 14.8 L 19.7 18.3 C 20.3 17.7 21.3 17.7 21.9 18.3 C 22.5 18.9 22.5 19.9 21.9 20.5 L 20.5 21.9 C 19.9 22.5 18.9 22.5 18.3 21.9 C 17.7 21.3 17.7 20.3 18.3 19.7 Z" />
    </svg>
  ),

  // — wide-slash (v2): Aggressive, tapered crescent for high visual impact
  "wide-slash": () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      {/* Questo path cattura la potenza del design generato:
        1. Estrema conicità: le punte sono quasi invisibili (M 2 12 ... 22 12).
        2. Curva esterna profonda (2,12 a 12,22), che simula la forza centrifuga.
        3. Curva interna nitida (22,12 a 12,18), che crea un "ventre" e l'effetto taglio.
      */}
      <path 
        d="M 2 12 
           C 2 12, 4 18, 12 22 
           C 20 18, 22 12, 22 12 
           C 22 12, 18 16, 12 18 
           C 6 16, 2 12, 2 12 Z"
      />
    </svg>
  ),

// — arrow-storm: Precision synchronized raining arrow volley, oriented diagonally
  // Three instances of the redesigned arrow, diagonally oriented (45 degrees down-right), 
  // with equal-sized side arrows for a balanced depth effect.
  "arrow-storm": () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      {/* Freccia laterale 1 (In alto a destra, orientata a 45 gradi verso il basso-destra) */}
      <path 
        d="M 12 23 L 9.5 20.5 L 11 19 L 11 6 L 9.5 4.5 L 10 4 L 12 1 L 14 4 L 14.5 4.5 L 13 6 L 13 19 L 14.5 20.5 Z" 
        transform="translate(4.5, -4.5) scale(0.75) rotate(-45 12 12)" 
        opacity="0.85"
      />
      
      {/* Freccia laterale 2 (In basso a sinistra, orientata a 45 gradi verso il basso-destra) */}
      <path 
        d="M 12 23 L 9.5 20.5 L 11 19 L 11 6 L 9.5 4.5 L 10 4 L 12 1 L 14 4 L 14.5 4.5 L 13 6 L 13 19 L 14.5 20.5 Z" 
        transform="translate(-3.5, 3.5) scale(0.75) rotate(-45 12 12)" 
        opacity="0.85"
      />
      
      {/* Freccia centrale in foreground (Grande, a fuoco, orientata a 45 gradi verso il basso-destra) */}
      <path 
        d="M 12 23 L 9.5 20.5 L 11 19 L 11 6 L 9.5 4.5 L 10 4 L 12 1 L 14 4 L 14.5 4.5 L 13 6 L 13 19 L 14.5 20.5 Z" 
        transform="translate(1.5, 1.5) scale(0.9) rotate(-45 12 12)" 
      />
    </svg>
  ),

  // bulls-eye: layered target with crosshair and central dot
  "bulls-eye": () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      {/* Cerchio esterno "bucato" a forma di anello: 
          Tracciato esterno e interno combinati in un singolo 'd' con fillRule="evenodd" */}
      <path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M 12 2 A 10 10 0 0 0 12 22 A 10 10 0 0 0 12 2 Z M 12 5 A 7 7 0 0 1 12 19 A 7 7 0 0 1 12 5 Z"
      />
      
      {/* Il mirino a croce centrale */}
      <path d="M 11.5 4 V 20 H 12.5 V 4 H 11.5 Z M 4 11.5 H 20 V 12.5 H 4 V 11.5 Z" />
      
      {/* Il punto centrale per la messa a fuoco */}
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),

  // — stun (v3): Classic gaming "dizzy" effect with spinning stars and motion trails
  stun: () => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      {/* Stella 1 (In alto al centro) */}
      <path d="M 12 1 L 13.5 4.5 L 17 6 L 13.5 7.5 L 12 11 L 10.5 7.5 L 7 6 L 10.5 4.5 Z" />
      
      {/* Stella 2 (In basso a destra) */}
      <path d="M 19 13 L 20.2 15.8 L 23 17 L 20.2 18.2 L 19 21 L 17.8 18.2 L 15 17 L 17.8 15.8 Z" />
      
      {/* Stella 3 (In basso a sinistra) */}
      <path d="M 5 13 L 6.2 15.8 L 9 17 L 6.2 18.2 L 5 21 L 3.8 18.2 L 1 17 L 3.8 15.8 Z" />

      {/* Scie di movimento circolari (Creano l'effetto di rotazione) */}
      {/* Scia in alto a destra */}
      <path d="M 15 3 A 9 9 0 0 1 22 12 A 7 7 0 0 0 14 5 Z" />
      
      {/* Scia in basso */}
      <path d="M 21 19 A 9 9 0 0 1 9 22 A 7 7 0 0 0 18 18 Z" />

      {/* Scia a sinistra */}
      <path d="M 2 12 A 9 9 0 0 1 9 3 A 7 7 0 0 0 4 10 Z" />
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
