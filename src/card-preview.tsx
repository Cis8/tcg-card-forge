import React, { useState, useRef, useId, useMemo, useCallback, useLayoutEffect, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { adaptColorForBg, deriveFaction, deriveRarityDeep, deriveRarityGlow } from './color-utils';
import { Glyph, RarityShape, CornerFlourish } from './glyphs';
import type { Card, CardWithArt, Faction, Rarity, Keyword, FrameVariant, FontVariant, StatShape, ThematicGlyphName } from './types';

interface CardPreviewProps {
  card: CardWithArt;
  keywords: Keyword[];
  factions: Faction[];
  rarities: Rarity[];
  cards?: CardWithArt[];
  font?: FontVariant;
  costShape?:   StatShape;
  attackShape?: StatShape;
  healthShape?: StatShape;
  costColor?:   string;
  attackColor?: string;
  healthColor?: string;
  onEditCard?: (cardId: string) => void;
}

type Token =
  | { kind: 'text'; value: string }
  | { kind: 'kw'; keyword: Keyword }
  | { kind: 'card'; card: CardWithArt };

function parseDescription(
  text: string,
  kwById: Map<string, Keyword>,
  cardById: Map<string, CardWithArt>,
): Token[] {
  if (!text) return [];
  const tokens: Token[] = [];
  const re = /\[(kw|card):([^\]\n]+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ kind: 'text', value: text.slice(last, m.index) });
    const prefix = m[1];
    const id = m[2].trim();
    if (prefix === 'kw') {
      const kw = kwById.get(id);
      tokens.push(kw ? { kind: 'kw', keyword: kw } : { kind: 'text', value: m[0] });
    } else {
      const c = cardById.get(id);
      tokens.push(c ? { kind: 'card', card: c } : { kind: 'text', value: m[0] });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) tokens.push({ kind: 'text', value: text.slice(last) });
  return tokens;
}

type StatTone = 'amber' | 'crimson' | 'iron' | 'azure';
interface StatToneConfig { fill: string; rim: string; glow: string; ink: string }

function StatGem({ variant = 'gem', tone = 'azure', rimColor, value, size = 56 }: {
  variant?: StatShape;
  tone?: StatTone;
  rimColor?: string;
  value: number;
  size?: number;
}): React.ReactElement {
  const tones: Record<StatTone, StatToneConfig> = {
    amber:   { fill: '#1a0e02', rim: '#f1b637', glow: '#e9a126', ink: '#fff2c2' },
    crimson: { fill: '#1a0306', rim: '#e23a3a', glow: '#b21625', ink: '#fde0e0' },
    iron:    { fill: '#0d1116', rim: '#cfd6dd', glow: '#7c8a99', ink: '#f1f4f8' },
    azure:   { fill: '#02101e', rim: '#5dbce5', glow: '#236aa6', ink: '#dff0fa' },
  };
  const t: StatToneConfig = rimColor
    ? { fill: '#0d0d0d', rim: rimColor, glow: deriveRarityDeep(rimColor), ink: '#f4f4f4' }
    : tones[tone];
  const uid = useId();
  const gid = `gem-${uid}`, rid = `rim-${uid}`;
  const defs = (
    <defs>
      <radialGradient id={gid} cx="50%" cy="35%" r="65%">
        <stop offset="0%" stopColor={t.glow} stopOpacity=".95"/>
        <stop offset="55%" stopColor={t.fill}/><stop offset="100%" stopColor="#000"/>
      </radialGradient>
      <linearGradient id={rid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f7e3a3"/>
        <stop offset="50%" stopColor={t.rim}/><stop offset="100%" stopColor="#6b4a14"/>
      </linearGradient>
    </defs>
  );
  const text = (
    <text x="50" y="62" textAnchor="middle" fontFamily="Cinzel, serif" fontWeight="800"
          fontSize="40" fill={t.ink}
          style={{ paintOrder: 'stroke', stroke: '#000', strokeWidth: 2 } as React.CSSProperties}>
      {value}
    </text>
  );
  const wrap = (children: React.ReactNode) => (
    <svg viewBox="0 0 100 100" width={size} height={size}
         style={{ overflow: 'visible', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))', display: 'block' }}>
      {defs}{children}{text}
    </svg>
  );
  if (variant === 'shield') return wrap(
    <g>
      <path d="M50 4 L92 16 V46 C92 76 70 92 50 96 C30 92 8 76 8 46 V16 Z"
            fill={`url(#${gid})`} stroke={`url(#${rid})`} strokeWidth="4"/>
      <path d="M50 12 L84 22 V46 C84 70 66 84 50 88 C34 84 16 70 16 46 V22 Z"
            fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1"/>
    </g>
  );
  if (variant === 'circle') return wrap(
    <g>
      <circle cx="50" cy="50" r="44" fill={`url(#${gid})`} stroke={`url(#${rid})`} strokeWidth="5"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1"/>
      <ellipse cx="50" cy="32" rx="18" ry="9" fill="rgba(255,255,255,.18)"/>
    </g>
  );
  if (variant === 'rhombus') return wrap(
    <g>
      <polygon points="50,4 96,50 50,96 4,50"
               fill={`url(#${gid})`} stroke={`url(#${rid})`} strokeWidth="5"/>
      <polygon points="50,16 84,50 50,84 16,50"
               fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1"/>
      <polygon points="50,16 84,50 50,34 16,50" fill="rgba(255,255,255,.12)"/>
    </g>
  );
  if (variant === 'heart') return wrap(
    <g transform="translate(50 50) scale(1.25) translate(-50 -50)">
      <path d="M50,82 C10,60,6,24,30,16 C40,12,50,22,50,30 C50,22,60,12,70,16 C94,24,90,60,50,82 Z"
            fill={`url(#${gid})`} stroke={`url(#${rid})`} strokeWidth="4"/>
      <path d="M50,72 C18,54,14,28,34,22 C42,19,50,28,50,35 C50,28,58,19,66,22 C86,28,82,54,50,72 Z"
            fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1"/>
      <path d="M50,38 C50,30,42,22,34,25 C24,30,22,44,50,60 C78,44,76,30,66,25 C58,22,50,30,50,38 Z"
            fill="rgba(255,255,255,.1)"/>
    </g>
  );
  return wrap(
    <g>
      <polygon points="50,4 92,28 92,72 50,96 8,72 8,28"
               fill={`url(#${gid})`} stroke={`url(#${rid})`} strokeWidth="5"/>
      <polygon points="50,14 84,32 84,68 50,86 16,68 16,32"
               fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1"/>
      <polygon points="50,14 84,32 50,50 16,32" fill="rgba(255,255,255,.12)"/>
    </g>
  );
}

const PATTERN_BACKGROUNDS: Record<string, string> = {
  plain: 'transparent',
  damask: `
    radial-gradient(circle at 25% 25%, rgba(255,235,200,.07) 0%, transparent 18%),
    radial-gradient(circle at 75% 75%, rgba(255,235,200,.07) 0%, transparent 18%),
    radial-gradient(circle at 75% 25%, rgba(0,0,0,.18) 0%, transparent 14%),
    radial-gradient(circle at 25% 75%, rgba(0,0,0,.18) 0%, transparent 14%)`,
  lattice: `
    repeating-linear-gradient(45deg, rgba(255,235,200,.06) 0 1px, transparent 1px 12px),
    repeating-linear-gradient(-45deg, rgba(255,235,200,.06) 0 1px, transparent 1px 12px),
    repeating-linear-gradient(45deg, rgba(0,0,0,.12) 0 1px, transparent 1px 24px)`,
  rays: `
    repeating-conic-gradient(from 0deg at 50% -10%, rgba(255,235,200,.13) 0deg 8deg, transparent 8deg 16deg),
    repeating-conic-gradient(from 0deg at 50% 120%, rgba(0,0,0,.12) 0deg 8deg, transparent 8deg 16deg)`,
  scales: `
    radial-gradient(circle at 50% 0%, transparent 8px, rgba(0,0,0,.2) 9px, transparent 10px),
    radial-gradient(circle at 0 8px, transparent 8px, rgba(0,0,0,.2) 9px, transparent 10px),
    radial-gradient(circle at 100% 8px, transparent 8px, rgba(0,0,0,.2) 9px, transparent 10px)`,
};

/** Resolves the watermark glyph name for the description box, or null for no watermark. */
function resolveDescriptionGlyph(card: Card, factionGlyph: ThematicGlyphName): ThematicGlyphName | null {
  if (card.descGlyph === 'none') return null;
  if (!card.descGlyph || card.descGlyph === 'faction') return factionGlyph;
  return card.descGlyph;
}

/** Returns a validated hex color string or undefined if invalid/absent. */
function validHex(value: string | null | undefined): string | undefined {
  if (typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)) return value;
  return undefined;
}

export function CardPreview({ card, keywords, factions, rarities, cards,
                              font = 'cinzel',
                              costShape = 'rhombus', attackShape = 'gem', healthShape = 'heart',
                              costColor = '#5dbce5', attackColor = '#7c8a99', healthColor = '#b21625',
                              onEditCard,
                            }: CardPreviewProps): React.ReactElement {
  const frame: FrameVariant =
    card.frame === 'classic' || card.frame === 'inscribed' ? card.frame : 'ornate';
  const factionRaw = factions.find(f => f.id === card.faction) ?? factions[0];
  const faction = deriveFaction(factionRaw);
  const rarity = card.rarity ? rarities.find(r => r.id === card.rarity) : undefined;
  const rarityDeep = rarity ? deriveRarityDeep(rarity.color) : 'transparent';
  const rarityGlow = rarity ? deriveRarityGlow(rarity.color) : 'transparent';
  const isUnit = card.type === 'unit';

  const kwById = useMemo(() => {
    const m = new Map<string, Keyword>();
    keywords.forEach(k => m.set(k.id, k));
    return m;
  }, [keywords]);
  const cardById = useMemo(() => {
    const m = new Map<string, CardWithArt>();
    (cards ?? []).forEach(c => m.set(c.id, c));
    return m;
  }, [cards]);
  const tokens = parseDescription(card.description, kwById, cardById);

  const descWatermarkGlyph = resolveDescriptionGlyph(card, factionRaw.glyph);
  const descBg = validHex(card.descBg);
  const descEffectiveBg = descBg ?? faction.parchment;
  const namePlateRef = useRef<HTMLDivElement>(null);
  const nameFit = useCardNameFit(card.name || 'Untitled', font, namePlateRef);

  return (
    <div className={`card-shell card-frame-${frame} card-font-${font}`}
         style={{
           '--rarity-color': rarity?.color ?? 'transparent', '--rarity-deep': rarityDeep,
           '--rarity-glow': rarityGlow,
           '--theme-accent': faction.accent, '--theme-deep': faction.deep,
           '--theme-bg-0': faction.bg[0], '--theme-bg-1': faction.bg[1],
           '--theme-bg-2': faction.bg[2], '--theme-bg-3': faction.bg[3],
           '--theme-parchment': faction.parchment,
           '--theme-parchment-shade': faction.parchmentShade,
           '--theme-plate': faction.plate, '--theme-plate-ink': faction.plateInk,
           ...(descBg ? { '--desc-bg': descBg } : {}),
         } as React.CSSProperties}>
      <div className="card-frame">
        <div className="card-fill"/>
        <div className="card-pattern"
             style={{ backgroundImage: PATTERN_BACKGROUNDS[card.pattern] ?? 'transparent' }}/>

        {frame === 'ornate' && (
          <>
            <div className="corner tl"><CornerFlourish side="tl" color={rarity?.color}/></div>
            <div className="corner tr"><CornerFlourish side="tr" color={rarity?.color}/></div>
            <div className="corner bl"><CornerFlourish side="bl" color={rarity?.color}/></div>
            <div className="corner br"><CornerFlourish side="br" color={rarity?.color}/></div>
          </>
        )}

        {rarity && (
          <div className="rarity-gem" title={rarity.name}>
            <RarityShape shape={rarity.shape} color={rarity.color} size={22}/>
          </div>
        )}

        <div className="name-plate">
          <div className="name-plate-inner" ref={namePlateRef}>
            <div className="card-name" style={nameFit}>
              {card.name || 'Untitled'}
            </div>
          </div>
        </div>

        <div className="art-window">
          {card.artHandle ? (
            <img className="art-image" src={card.artHandle.objectUrl} alt=""/>
          ) : (
            <div className="art-themed" style={{
              background: `radial-gradient(ellipse 80% 70% at 50% 30%, ${faction.bg[2]} 0%, ${faction.bg[1]} 50%, ${faction.bg[0]} 100%)`,
            }}>
              <div className="art-watermark" style={{ color: faction.accent }}>
                <Glyph name={factionRaw.glyph} size={180}/>
              </div>
            </div>
          )}
        </div>

        <div className="type-plate">
          <span className="type-glyph"><Glyph name={factionRaw.glyph} size={14}/></span>
          <span className="type-label">
            {isUnit ? 'Unit' : 'Spell'}
            {card.subtype ? <span className="type-sub"> · {card.subtype}</span> : null}
          </span>
          <span className="type-glyph"><Glyph name={factionRaw.glyph} size={14}/></span>
        </div>

        <div className="text-box">
          {descWatermarkGlyph && (
            <div className="text-box-watermark" aria-hidden="true" style={{ color: faction.accent }}>
              <Glyph name={descWatermarkGlyph} size={80}/>
            </div>
          )}
          <div className="text-box-inner">
            <p className="card-text">
              {tokens.length === 0
                ? <span style={{ opacity: .35, fontStyle: 'italic' }}>
                    Description appears here. Use @ Reference to insert keywords and cards.
                  </span>
                : tokens.map((t, i) => {
                    if (t.kind === 'text') {
                      return t.value.split('\n').map((line, j, arr) => (
                        <React.Fragment key={`${i}-${j}`}>
                          {line}{j < arr.length - 1 ? <br/> : null}
                        </React.Fragment>
                      ));
                    }
                    if (t.kind === 'card') {
                      return <CardRefSpan key={i} card={t.card} factions={factions} rarities={rarities} keywords={keywords} cards={cards ?? []} descBg={descEffectiveBg} onEditCard={onEditCard}/>;
                    }
                    return <KeywordSpan key={i} keyword={t.keyword} descBg={descEffectiveBg} keywords={keywords} cards={cards} factions={factions} rarities={rarities}/>;
                  })}
            </p>
            {card.flavor && <p className="card-flavor">{card.flavor}</p>}
          </div>
        </div>

      </div>

      <div className="cost-gem">
        <StatGem variant={costShape} rimColor={costColor} value={card.cost ?? 0} size={64}/>
      </div>

      {isUnit && (
        <>
          <div className="stat stat-attack">
            <StatGem variant={attackShape} rimColor={attackColor} value={card.attack ?? 0} size={62}/>
          </div>
          <div className="stat stat-health">
            <StatGem variant={healthShape} rimColor={healthColor} value={card.health ?? 0} size={62}/>
          </div>
        </>
      )}
    </div>
  );
}

const NAME_BASE_SIZE = 24;
const NAME_MIN_SIZE = 14;
const NAME_BASE_TRACKING = 0.03;
const NAME_MIN_TRACKING = 0.01;

function fontFamilyForVariant(font: FontVariant): string {
  if (font === 'fell') return `'IM Fell English SC', serif`;
  if (font === 'trajan') return `'Cinzel Decorative', serif`;
  return `'Cinzel', serif`;
}

function trackingForSize(size: number): number {
  const range = NAME_BASE_SIZE - NAME_MIN_SIZE;
  if (range <= 0) return NAME_MIN_TRACKING;
  const t = (size - NAME_MIN_SIZE) / range;
  return NAME_MIN_TRACKING + Math.max(0, Math.min(1, t)) * (NAME_BASE_TRACKING - NAME_MIN_TRACKING);
}

function useCardNameFit(
  name: string,
  font: FontVariant,
  containerRef: React.RefObject<HTMLDivElement | null>
): React.CSSProperties {
  const [style, setStyle] = useState<React.CSSProperties>({
    fontSize: `${NAME_BASE_SIZE}px`,
    letterSpacing: `${NAME_BASE_TRACKING}em`,
  });

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const measure = () => {
      const available = node.clientWidth - parseFloat(getComputedStyle(node).paddingLeft) - parseFloat(getComputedStyle(node).paddingRight);
      if (available <= 0) return;

      const computed = getComputedStyle(node);
      const fontWeight = font === 'trajan' ? '700' : '600';
      const fontStyle = computed.fontStyle || 'normal';
      const family = fontFamilyForVariant(font);
      const widthAt = (size: number, trackingEm: number) => {
        ctx.font = `${fontStyle} ${fontWeight} ${size}px ${family}`;
        const base = ctx.measureText(name).width;
        const spacing = Math.max(0, name.length - 1) * size * trackingEm;
        return base + spacing;
      };

      let lo = NAME_MIN_SIZE;
      let hi = NAME_BASE_SIZE;
      let best = NAME_MIN_SIZE;
      for (let i = 0; i < 18; i += 1) {
        const mid = (lo + hi) / 2;
        const tracking = trackingForSize(mid);
        if (widthAt(mid, tracking) <= available) {
          best = mid;
          lo = mid;
        } else {
          hi = mid;
        }
      }

      const tracking = trackingForSize(best);
      setStyle({
        fontSize: `${best.toFixed(2)}px`,
        letterSpacing: `${tracking.toFixed(3)}em`,
      });
    };

    const ro = new ResizeObserver(() => measure());
    ro.observe(node);
    measure();
    const fontsReady = document.fonts?.ready;
    if (fontsReady) {
      void fontsReady.then(measure).catch(() => undefined);
    }

    return () => ro.disconnect();
  }, [containerRef, font, name]);

  return style;
}

const KW_TIP_W = 220;
const KW_TIP_GAP = 10;
const KW_TIP_MARGIN = 8;
const KW_TIP_TOOLTIP_BG = '#1a1306';
// Card preview shown alongside keyword tooltip (first card ref in description)
const CARD_PREVIEW_SCALE_MAX = 0.5;
const CARD_PREVIEW_W_MAX = 170; // PREVIEW_W * CARD_PREVIEW_SCALE_MAX (340 * 0.5)
const CARD_PREVIEW_GAP = 8;
const MIN_CARD_PREVIEW_W = 80;

/**
 * DFS-collect all keywords transitively referenced by kw's description.
 * Returns them in branch-local order: within each branch, a keyword's own
 * references appear above (before) the keyword itself.
 * `seen` must be pre-seeded with the root keyword id to prevent cycles.
 */
function collectKwStack(kw: Keyword, kwById: Map<string, Keyword>, seen: Set<string>): Keyword[] {
  const result: Keyword[] = [];
  const tokens = parseDescription(kw.description, kwById, new Map());
  for (const t of tokens) {
    if (t.kind !== 'kw') continue;
    if (seen.has(t.keyword.id)) continue;
    seen.add(t.keyword.id);
    result.push(...collectKwStack(t.keyword, kwById, seen), t.keyword);
  }
  return result;
}

interface KeywordSpanProps {
  keyword: Keyword;
  descBg: string;
  keywords?: Keyword[];
  cards?: CardWithArt[];
  factions?: Faction[];
  rarities?: Rarity[];
}

/** Tooltip box (visual only — no position, no arrow). Used for nested kw sub-tips. */
function KwTipBox({ keyword, keywords, cards }: {
  keyword: Keyword;
  keywords?: Keyword[];
  cards?: CardWithArt[];
}): React.ReactElement {
  const kwById = useMemo(() => new Map((keywords ?? []).map(k => [k.id, k])), [keywords]);
  const cardById = useMemo(() => new Map((cards ?? []).map(c => [c.id, c])), [cards]);
  const tokens = useMemo(
    () => parseDescription(keyword.description, kwById, cardById),
    [keyword.description, kwById, cardById],
  );
  const displayColor = adaptColorForBg(keyword.color, KW_TIP_TOOLTIP_BG);
  return (
    <div className="kw-tip-box" style={{ borderColor: keyword.color }}>
      <b style={{ color: displayColor }}>
        <span style={{ display: 'inline-flex', verticalAlign: '-2px', marginRight: 4 }}>
          <Glyph name={keyword.glyph} size={13}/>
        </span>
        {keyword.name}
      </b>
      <span>
        {tokens.map((t, i) => {
          if (t.kind === 'text') return <React.Fragment key={i}>{t.value}</React.Fragment>;
          if (t.kind === 'kw') {
            const kwColor = adaptColorForBg(t.keyword.color, KW_TIP_TOOLTIP_BG);
            return (
              <span key={i} className="kw" style={{ color: kwColor }}>
                <span className="kw-glyph" style={{ color: kwColor }}>
                  <Glyph name={t.keyword.glyph} size={13}/>
                </span>
                <span className="kw-name">{t.keyword.name}</span>
              </span>
            );
          }
          if (t.kind === 'card') {
            const cardColor = adaptColorForBg('#d4a017', KW_TIP_TOOLTIP_BG);
            return (
              <span key={i} className="card-ref" style={{ color: cardColor }}>
                <span className="card-ref-name">{t.card.name}</span>
              </span>
            );
          }
          return null;
        })}
      </span>
    </div>
  );
}

function KeywordSpan({ keyword, descBg, keywords, cards, factions, rarities }: KeywordSpanProps): React.ReactElement {
  const [tipData, setTipData] = useState<{
    left: number; top: number; arrowLeft: number; below: boolean;
    cardLeft?: number; cardTop?: number; cardScale?: number;
  } | null>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const isTouchPrimary = useMemo(() => window.matchMedia('(pointer: coarse)').matches, []);

  const displayColor = adaptColorForBg(keyword.color, descBg);
  const displayColorInTip = adaptColorForBg(keyword.color, KW_TIP_TOOLTIP_BG);

  const kwById = useMemo(() => new Map((keywords ?? []).map(k => [k.id, k])), [keywords]);
  const cardById = useMemo(() => new Map((cards ?? []).map(c => [c.id, c])), [cards]);
  const tokens = useMemo(
    () => parseDescription(keyword.description, kwById, cardById),
    [keyword.description, kwById, cardById],
  );

  // Recursively collect all referenced keywords (DFS, deduplicated)
  const kwStack = useMemo(() => {
    const seen = new Set<string>([keyword.id]);
    return collectKwStack(keyword, kwById, seen);
  }, [keyword, kwById]);

  // First unique card ref in this keyword's description
  const firstCard = useMemo(() => {
    if (!factions?.length || !rarities?.length) return undefined;
    for (const t of tokens) {
      if (t.kind === 'card') return t.card;
    }
    return undefined;
  }, [tokens, factions, rarities]);

  const computeAndShow = useCallback(() => {
    if (!spanRef.current) return;
    const r = spanRef.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Pick whichever side has more space
    const spaceAbove = r.top - KW_TIP_GAP;
    const spaceBelow = vh - r.bottom - KW_TIP_GAP;
    const below = spaceBelow > spaceAbove;
    const anchorY = below ? r.bottom + KW_TIP_GAP : r.top - KW_TIP_GAP;

    let tooltipLeft: number;
    let arrowLeft: number;
    let cardLeft: number | undefined;
    let cardTop: number | undefined;
    let cardScale: number | undefined;

    if (firstCard) {
      const naturalTipLeft = cx - KW_TIP_W / 2;
      // Try card on the right
      const tipLeftR = Math.max(KW_TIP_MARGIN, Math.min(naturalTipLeft, vw - KW_TIP_W - KW_TIP_MARGIN));
      const cardLeftR = tipLeftR + KW_TIP_W + CARD_PREVIEW_GAP;
      if (cardLeftR + CARD_PREVIEW_W_MAX <= vw - KW_TIP_MARGIN) {
        tooltipLeft = tipLeftR;
        cardLeft = cardLeftR;
        cardScale = CARD_PREVIEW_SCALE_MAX;
      } else {
        // Try card on the left
        const minTipLeft = CARD_PREVIEW_W_MAX + CARD_PREVIEW_GAP + KW_TIP_MARGIN;
        const tipLeftL = Math.max(minTipLeft, Math.min(naturalTipLeft, vw - KW_TIP_W - KW_TIP_MARGIN));
        const cardLeftL = tipLeftL - CARD_PREVIEW_GAP - CARD_PREVIEW_W_MAX;
        if (cardLeftL >= KW_TIP_MARGIN) {
          tooltipLeft = tipLeftL;
          cardLeft = cardLeftL;
          cardScale = CARD_PREVIEW_SCALE_MAX;
        } else {
          // Scale down card to fit
          const maxCW = Math.floor(vw - 2 * KW_TIP_MARGIN - KW_TIP_W - CARD_PREVIEW_GAP);
          if (maxCW >= MIN_CARD_PREVIEW_W) {
            cardScale = maxCW / PREVIEW_W;
            tooltipLeft = Math.max(KW_TIP_MARGIN, Math.min(naturalTipLeft, vw - KW_TIP_W - KW_TIP_MARGIN));
            cardLeft = tooltipLeft + KW_TIP_W + CARD_PREVIEW_GAP;
          } else {
            // Not enough room — skip card preview
            tooltipLeft = Math.max(KW_TIP_MARGIN, Math.min(naturalTipLeft, vw - KW_TIP_W - KW_TIP_MARGIN));
          }
        }
      }
      if (cardLeft !== undefined && cardScale !== undefined) {
        const cH = Math.round(PREVIEW_H * cardScale);
        cardTop = below ? anchorY : anchorY - cH;
        cardTop = Math.max(KW_TIP_MARGIN, Math.min(cardTop, vh - cH - KW_TIP_MARGIN));
      }
    } else {
      tooltipLeft = Math.max(KW_TIP_MARGIN, Math.min(cx - KW_TIP_W / 2, vw - KW_TIP_W - KW_TIP_MARGIN));
    }

    arrowLeft = Math.max(10, Math.min(cx - tooltipLeft, KW_TIP_W - 10));
    setTipData({ left: tooltipLeft, top: anchorY, arrowLeft, below, cardLeft, cardTop, cardScale });
  }, [firstCard]);

  const hide = useCallback(() => setTipData(null), []);

  // Close when page scrolls or viewport resizes
  useEffect(() => {
    if (!tipData) return;
    window.addEventListener('scroll', hide, { passive: true, capture: true });
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [tipData, hide]);

  // Close when pointer-down fires outside the keyword span
  useEffect(() => {
    if (!tipData) return;
    const handler = (e: PointerEvent) => {
      if (!spanRef.current?.contains(e.target as Node)) hide();
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [tipData, hide]);

  // Inline (display-only) renderers for tokens inside the main tooltip box
  const renderTokensInTip = (toks: ReturnType<typeof parseDescription>) =>
    toks.map((t, i) => {
      if (t.kind === 'text') return <React.Fragment key={i}>{t.value}</React.Fragment>;
      if (t.kind === 'kw') {
        const kwColor = adaptColorForBg(t.keyword.color, KW_TIP_TOOLTIP_BG);
        return (
          <span key={i} className="kw" style={{ color: kwColor }}>
            <span className="kw-glyph" style={{ color: kwColor }}>
              <Glyph name={t.keyword.glyph} size={13}/>
            </span>
            <span className="kw-name">{t.keyword.name}</span>
          </span>
        );
      }
      if (t.kind === 'card') {
        const cardColor = adaptColorForBg('#d4a017', KW_TIP_TOOLTIP_BG);
        return (
          <span key={i} className="card-ref" style={{ color: cardColor }}>
            <span className="card-ref-name">{t.card.name}</span>
          </span>
        );
      }
      return null;
    });

  const mainTipBox = (
    <div className="kw-tip-box" role="tooltip" style={{ borderColor: keyword.color }}>
      <b style={{ color: displayColorInTip }}>
        <span style={{ display: 'inline-flex', verticalAlign: '-2px', marginRight: 4 }}>
          <Glyph name={keyword.glyph} size={13}/>
        </span>
        {keyword.name}
      </b>
      <span>{renderTokensInTip(tokens)}</span>
      {/* Arrow points toward the keyword span */}
      <div
        className={`kw-tip-box-arrow${tipData?.below ? ' kw-tip-box-arrow--below' : ''}`}
        aria-hidden="true"
        style={{ left: tipData?.arrowLeft ?? 110 }}
      />
    </div>
  );

  return (
    <span className="kw" style={{ color: displayColor }} ref={spanRef}
          onMouseEnter={isTouchPrimary ? undefined : computeAndShow}
          onMouseLeave={isTouchPrimary ? undefined : hide}
          onClick={isTouchPrimary ? (e) => { e.stopPropagation(); tipData ? hide() : computeAndShow(); } : undefined}>
      <span className="kw-glyph" style={{ color: displayColor }}>
        <Glyph name={keyword.glyph} size={13}/>
      </span>
      <span className="kw-name">{keyword.name}</span>
      {tipData && ReactDOM.createPortal(
        <>
          {/* Tooltip stack: nested keyword boxes + main tooltip box */}
          <div
            className={`kw-tip-stack${tipData.below ? ' kw-tip-stack--below' : ''}`}
            style={{ left: tipData.left, top: tipData.top }}
          >
            {tipData.below ? (
              // Below mode: main first (closest to keyword), nested below
              <>
                {mainTipBox}
                {kwStack.map(kw => (
                  <KwTipBox key={kw.id} keyword={kw} keywords={keywords} cards={cards}/>
                ))}
              </>
            ) : (
              // Above mode: nested first (furthest from keyword), main last (closest)
              <>
                {kwStack.map(kw => (
                  <KwTipBox key={kw.id} keyword={kw} keywords={keywords} cards={cards}/>
                ))}
                {mainTipBox}
              </>
            )}
          </div>

          {/* Card preview: scaled CardPreview alongside the tooltip stack */}
          {tipData.cardLeft !== undefined && tipData.cardTop !== undefined &&
           tipData.cardScale !== undefined && firstCard && factions && rarities && (
            <div style={{
              position: 'fixed',
              left: tipData.cardLeft,
              top: tipData.cardTop,
              pointerEvents: 'none',
              zIndex: 200,
              filter: 'drop-shadow(0 8px 28px rgba(0,0,0,.8))',
            }}>
              <ScaledCardPreview
                scale={tipData.cardScale}
                card={firstCard}
                keywords={keywords ?? []}
                factions={factions}
                rarities={rarities}
                cards={cards}
              />
            </div>
          )}
        </>,
        document.body
      )}
    </span>
  );
}

// ── Card hover preview ────────────────────────────────────────────────────
// Wrap any single element to show a scaled full-card preview on hover/focus.

export interface CardHoverPreviewProps extends CardPreviewProps {
  children: React.ReactNode;
  tag?: 'div' | 'span';
  /** Already-bound action for this specific card reference (click on desktop, Edit button on mobile). */
  onEdit?: () => void;
}

const PREVIEW_W = 340; // native card width
const PREVIEW_H = 488; // native card height (stat gems may bleed ~30px below)

/** Renders a CardPreview at an arbitrary scale without clipping gem bleeds. */
function ScaledCardPreview({ scale, ...previewProps }: CardPreviewProps & { scale: number }): React.ReactElement {
  const w = Math.round(PREVIEW_W * scale);
  const h = Math.round(PREVIEW_H * scale);
  return (
    <div style={{ width: w, height: h, overflow: 'visible', flexShrink: 0, pointerEvents: 'none' }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: PREVIEW_W, height: PREVIEW_H }}>
        <CardPreview {...previewProps} />
      </div>
    </div>
  );
}

export function CardHoverPreview({ children, tag, onEdit, ...previewProps }: CardHoverPreviewProps): React.ReactElement {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Detect touch-primary devices once at mount; stable for the component lifetime.
  const isTouchPrimary = useMemo(() => window.matchMedia('(pointer: coarse)').matches, []);

  const show = useCallback(() => {
    if (isTouchPrimary || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const GAP = 14;
    let x = r.right + GAP;
    let y = r.top + r.height / 2 - PREVIEW_H / 2;
    if (x + PREVIEW_W > window.innerWidth - 8) x = r.left - PREVIEW_W - GAP;
    x = Math.max(8, Math.min(x, window.innerWidth - PREVIEW_W - 8));
    y = Math.max(8, Math.min(y, window.innerHeight - PREVIEW_H - 8));
    setPos({ x, y });
  }, [isTouchPrimary]);

  const hide = useCallback(() => setPos(null), []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isTouchPrimary) {
      e.stopPropagation();
      setMobileOpen(v => !v);
    } else {
      onEdit?.();
    }
  }, [isTouchPrimary, onEdit]);

  const Tag = tag ?? 'div';
  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement & HTMLSpanElement>}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onWheel={hide}
      onClick={handleClick}
      style={onEdit && !isTouchPrimary ? { cursor: 'pointer' } : undefined}
    >
      {children}

      {/* Desktop: side hover preview */}
      {pos && ReactDOM.createPortal(
        <div className="card-preview-hover-portal" style={{ left: pos.x, top: pos.y }}>
          <CardPreview {...previewProps} />
        </div>,
        document.body
      )}

      {/* Mobile: centered overlay on tap */}
      {mobileOpen && ReactDOM.createPortal(
        <MobileCardOverlay
          previewProps={previewProps}
          onEdit={onEdit}
          onClose={() => setMobileOpen(false)}
        />,
        document.body
      )}
    </Tag>
  );
}

function MobileCardOverlay({ previewProps, onEdit, onClose }: {
  previewProps: CardPreviewProps;
  onEdit?: () => void;
  onClose: () => void;
}): React.ReactElement {
  const scale = Math.min(
    1,
    (window.innerWidth  - 32) / PREVIEW_W,
    (window.innerHeight - 120) / PREVIEW_H,
  );
  return (
    <div className="card-ref-overlay" onClick={onClose}>
      <div className="card-ref-overlay-inner" onClick={e => e.stopPropagation()}>
        <ScaledCardPreview scale={scale} {...previewProps} />
        <div className="card-ref-overlay-actions">
          {onEdit && (
            <button className="btn btn-primary btn-sm" onClick={() => { onEdit(); onClose(); }}>
              Edit card
            </button>
          )}
          <button className="btn btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

interface CardRefSpanProps {
  card: CardWithArt;
  factions: Faction[];
  rarities: Rarity[];
  keywords: Keyword[];
  cards: CardWithArt[];
  descBg: string;
  onEditCard?: (cardId: string) => void;
}

function CardRefSpan({ card, factions, rarities, keywords, cards, descBg, onEditCard }: CardRefSpanProps): React.ReactElement {
  const factionRaw = factions.find(f => f.id === card.faction) ?? factions[0];
  const accent = factionRaw ? deriveFaction(factionRaw).accent : '#d4a017';
  const displayColor = adaptColorForBg(accent, descBg);
  const onEdit = onEditCard ? () => onEditCard(card.id) : undefined;
  return (
    <CardHoverPreview tag="span" card={card} factions={factions} rarities={rarities} keywords={keywords} cards={cards} onEdit={onEdit}>
      <span className="card-ref" style={{ color: displayColor }}>
        <span className="card-ref-name">{card.name || 'Untitled'}</span>
      </span>
    </CardHoverPreview>
  );
}
