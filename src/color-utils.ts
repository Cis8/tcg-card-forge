import type { Theme, DerivedTheme } from './types';

export function hexToRgb(hex: string): [number, number, number] {
  const h = String(hex || '#000').replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0) return [l * 255, l * 255, l * 255];
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    hue2rgb(p, q, h + 1 / 3) * 255,
    hue2rgb(p, q, h) * 255,
    hue2rgb(p, q, h - 1 / 3) * 255,
  ];
}

export const hexToHsl = (hex: string): [number, number, number] => rgbToHsl(...hexToRgb(hex));
export const hslToHex = (h: number, s: number, l: number): string => rgbToHex(...hslToRgb(h, s, l));

const clamp = (n: number, a: number, b: number): number => Math.max(a, Math.min(b, n));

export function deriveTheme(theme: Theme): DerivedTheme {
  const [h0, s0, l0] = hexToHsl(theme.primary || '#888');
  const h = h0;
  const s = s0 < 0.05 ? 0.05 : s0;
  const l = clamp(l0, 0.18, 0.65);
  return {
    ...theme,
    bg: [
      hslToHex(h, s * 0.7,  clamp(l * 0.22, 0.04, 0.14)),
      hslToHex(h, s * 0.85, clamp(l * 0.5,  0.1,  0.3 )),
      hslToHex(h, s,        l),
      hslToHex(h, clamp(s * 0.95, 0, 1), clamp(l + 0.3, 0.55, 0.92)),
    ],
    accent:        hslToHex(h, s,                      clamp(l + 0.1, 0.4,  0.78)),
    deep:          hslToHex(h, clamp(s * 0.45, 0, 1),  clamp(l * 0.18, 0.04, 0.1)),
    parchment:     hslToHex(h, clamp(s * 0.28, 0, 0.18), 0.93),
    parchmentShade:hslToHex(h, clamp(s * 0.3,  0, 0.22), 0.78),
    plate:         hslToHex(h, clamp(s * 0.55, 0, 1),  clamp(l * 0.28, 0.06, 0.18)),
    plateInk:      hslToHex(h, clamp(s * 0.5,  0, 1),  clamp(l + 0.45, 0.7, 0.93)),
  };
}

export function deriveRarityDeep(color: string): string {
  const [h, s, l] = hexToHsl(color || '#888');
  return hslToHex(h, clamp(s * 0.7, 0, 1), clamp(l * 0.4, 0.06, 0.3));
}

export function deriveRarityGlow(color: string): string {
  const [h, s, l] = hexToHsl(color || '#888');
  const [r, g, b] = hslToRgb(h, s, clamp(l + 0.1, 0.4, 0.8));
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},.65)`;
}
