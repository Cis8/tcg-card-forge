import React, { useState, useRef, useId, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { deriveFaction, deriveRarityDeep, deriveRarityGlow } from './color-utils';
import { Glyph, RarityShape, CornerFlourish } from './glyphs';
import type { Card, Faction, Rarity, Keyword, FrameVariant, FontVariant, StatShape } from './types';

interface CardPreviewProps {
  card: Card;
  keywords: Keyword[];
  factions: Faction[];
  rarities: Rarity[];
  font?: FontVariant;
  costShape?:   StatShape;
  attackShape?: StatShape;
  healthShape?: StatShape;
  costColor?:   string;
  attackColor?: string;
  healthColor?: string;
}

interface Token {
  kind: 'text' | 'kw';
  value?: string;
  keyword?: Keyword;
}

function parseDescription(text: string, keywordsByLowerName: Map<string, Keyword>): Token[] {
  if (!text) return [];
  const tokens: Token[] = [];
  const re = /\[([^\]\n]+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ kind: 'text', value: text.slice(last, m.index) });
    const key = m[1].trim().toLowerCase();
    const kw = keywordsByLowerName.get(key);
    tokens.push(kw ? { kind: 'kw', keyword: kw } : { kind: 'text', value: m[0] });
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
    <g>
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

export function CardPreview({ card, keywords, factions, rarities,
                              font = 'cinzel',
                              costShape = 'rhombus', attackShape = 'gem', healthShape = 'heart',
                              costColor = '#5dbce5', attackColor = '#7c8a99', healthColor = '#b21625',
                            }: CardPreviewProps): React.ReactElement {
  const frame: FrameVariant =
    card.frame === 'classic' || card.frame === 'inscribed' ? card.frame : 'ornate';
  const factionRaw = factions.find(f => f.id === card.faction) ?? factions[0];
  const faction = deriveFaction(factionRaw);
  const rarity = rarities.find(r => r.id === card.rarity) ?? rarities[0];
  const rarityDeep = deriveRarityDeep(rarity.color);
  const rarityGlow = deriveRarityGlow(rarity.color);
  const isUnit = card.type === 'unit';

  const kwByName = useMemo(() => {
    const m = new Map<string, Keyword>();
    keywords.forEach(k => m.set(k.name.toLowerCase(), k));
    return m;
  }, [keywords]);
  const tokens = parseDescription(card.description, kwByName);

  return (
    <div className={`card-shell card-frame-${frame} card-font-${font}`}
         style={{
           '--rarity-color': rarity.color, '--rarity-deep': rarityDeep,
           '--rarity-glow': rarityGlow,
           '--theme-accent': faction.accent, '--theme-deep': faction.deep,
           '--theme-bg-0': faction.bg[0], '--theme-bg-1': faction.bg[1],
           '--theme-bg-2': faction.bg[2], '--theme-bg-3': faction.bg[3],
           '--theme-parchment': faction.parchment,
           '--theme-parchment-shade': faction.parchmentShade,
           '--theme-plate': faction.plate, '--theme-plate-ink': faction.plateInk,
         } as React.CSSProperties}>
      <div className="card-frame">
        <div className="card-fill"/>
        <div className="card-pattern"
             style={{ backgroundImage: PATTERN_BACKGROUNDS[card.pattern] ?? 'transparent' }}/>

        {frame === 'ornate' && (
          <>
            <div className="corner tl"><CornerFlourish side="tl" color={rarity.color}/></div>
            <div className="corner tr"><CornerFlourish side="tr" color={rarity.color}/></div>
            <div className="corner bl"><CornerFlourish side="bl" color={rarity.color}/></div>
            <div className="corner br"><CornerFlourish side="br" color={rarity.color}/></div>
          </>
        )}

        <div className="rarity-gem" title={rarity.name}>
          <RarityShape shape={rarity.shape} color={rarity.color} size={22}/>
        </div>

        <div className="name-plate">
          <div className="name-plate-inner">
            <div className="card-name" style={{ fontSize: scaleName(card.name) }}>
              {card.name || 'Untitled'}
            </div>
          </div>
        </div>

        <div className="art-window">
          {card.art ? (
            <img className="art-image" src={card.art} alt=""/>
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
          <div className="text-box-inner">
            <p className="card-text">
              {tokens.length === 0
                ? <span style={{ opacity: .35, fontStyle: 'italic' }}>
                    Description appears here. Wrap a keyword in [brackets] to style it.
                  </span>
                : tokens.map((t, i) => {
                    if (t.kind === 'text') {
                      return (t.value ?? '').split('\n').map((line, j, arr) => (
                        <React.Fragment key={`${i}-${j}`}>
                          {line}{j < arr.length - 1 ? <br/> : null}
                        </React.Fragment>
                      ));
                    }
                    return <KeywordSpan key={i} keyword={t.keyword!}/>;
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

function scaleName(name: string): string {
  const n = (name || '').length;
  if (n <= 14) return '24px';
  if (n <= 20) return '20px';
  if (n <= 26) return '17px';
  return '15px';
}

function KeywordSpan({ keyword }: { keyword: Keyword }): React.ReactElement {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const updatePos = () => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ x: r.left + r.width / 2, y: r.top });
  };
  return (
    <span className="kw" style={{ color: keyword.color }} ref={ref}
          onMouseEnter={updatePos} onMouseLeave={() => setPos(null)}>
      <span className="kw-glyph" style={{ color: keyword.color }}>
        <Glyph name={keyword.glyph} size={13}/>
      </span>
      <span className="kw-name">{keyword.name}</span>
      {pos && ReactDOM.createPortal(
        <div className="kw-tip-portal" role="tooltip"
             style={{ left: pos.x, top: pos.y, borderColor: keyword.color }}>
          <b style={{ color: keyword.color }}>
            <span style={{ display: 'inline-flex', verticalAlign: '-2px', marginRight: 4 }}>
              <Glyph name={keyword.glyph} size={13}/>
            </span>
            {keyword.name}
          </b>
          <span>{keyword.description}</span>
        </div>,
        document.body
      )}
    </span>
  );
}

// ── Card hover preview ────────────────────────────────────────────────────
// Wrap any single element to show a scaled full-card preview on hover/focus.

export interface CardHoverPreviewProps extends CardPreviewProps {
  children: React.ReactNode;
}

const PREVIEW_W = 340; // native card width
const PREVIEW_H = 488; // native card height (stat gems may bleed ~30px below)

export function CardHoverPreview({ children, ...previewProps }: CardHoverPreviewProps): React.ReactElement {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const GAP = 14;
    let x = r.right + GAP;
    let y = r.top + r.height / 2 - PREVIEW_H / 2;
    // flip to left side if no room on the right
    if (x + PREVIEW_W > window.innerWidth - 8) x = r.left - PREVIEW_W - GAP;
    // clamp both axes to keep inside viewport
    x = Math.max(8, Math.min(x, window.innerWidth - PREVIEW_W - 8));
    y = Math.max(8, Math.min(y, window.innerHeight - PREVIEW_H - 8));
    setPos({ x, y });
  }, []);

  const hide = useCallback(() => setPos(null), []);

  return (
    <div
      ref={ref}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onWheel={hide}
    >
      {children}
      {pos && ReactDOM.createPortal(
        <div className="card-preview-hover-portal" style={{ left: pos.x, top: pos.y }}>
          <CardPreview {...previewProps} />
        </div>,
        document.body
      )}
    </div>
  );
}
