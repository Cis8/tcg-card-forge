// App.tsx — main shell. Owns: current card, saved cards, keyword library,
// theme list, rarity list. All persisted to localStorage.

import React, { useState, useEffect, useRef } from 'react';
import * as htmlToImage from 'html-to-image';

import { DEFAULT_THEMES, DEFAULT_RARITIES, DEFAULT_KEYWORDS, SEED_CARDS } from './data';
import { CardPreview } from './card-preview';
import { LeftPanel, RightPanel } from './controls';
import { KeywordManager } from './keyword-manager';
import { ThemeManager } from './theme-manager';
import { RarityManager } from './rarity-manager';
import { Collection } from './collection';

import { Glyph } from './glyphs';
import type { Card, Theme, Rarity, Keyword, TweakState } from './types';

const STORAGE = {
  cards:    'tcg.cards.v2',
  current:  'tcg.current.v2',
  keywords: 'tcg.keywords.v2',
  themes:   'tcg.themes.v2',
  rarities: 'tcg.rarities.v2',
} as const;

const BLANK_CARD = (themes: Theme[], rarities: Rarity[]): Card => ({
  id: `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
  type: 'unit',
  name: '',
  subtype: '',
  theme: themes[0]?.id ?? 'fire',
  pattern: 'damask',
  rarity: rarities[0]?.id ?? 'common',
  cost: 1,
  attack: 1,
  health: 1,
  description: '',
  flavor: '',
  art: null,
});

const TWEAK_DEFAULTS: Partial<TweakState> = {
  frame: 'ornate',
  font: 'cinzel',
  statShape: 'gem',
  costColor:   '#5dbce5',  // azure (original cost tone)
  attackColor: '#e23a3a',  // crimson (original attack tone)
  healthColor: '#cfd6dd',  // iron (original health tone)
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded or private mode */ }
}

export default function App(): React.ReactElement {
  const [themes, setThemes]     = useState<Theme[]>(() => load(STORAGE.themes, DEFAULT_THEMES));
  const [rarities, setRarities] = useState<Rarity[]>(() => load(STORAGE.rarities, DEFAULT_RARITIES));
  const [keywords, setKeywords] = useState<Keyword[]>(() => load(STORAGE.keywords, DEFAULT_KEYWORDS));
  const [cards, setCards]       = useState<Card[]>(() => load(STORAGE.cards, SEED_CARDS));
  const [current, setCurrent]   = useState<Card>(() => {
    const stored = load<Card | null>(STORAGE.current, null);
    const base = stored ?? { ...SEED_CARDS[0] };
    // Sanitize stale theme/rarity IDs that may have been deleted since last session.
    const validTheme   = themes.find((t) => t.id === base.theme)   ? base.theme   : themes[0]?.id   ?? base.theme;
    const validRarity  = rarities.find((r) => r.id === base.rarity) ? base.rarity : rarities[0]?.id ?? base.rarity;
    return { ...base, theme: validTheme, rarity: validRarity };
  });

  const [showKeywords, setShowKeywords]   = useState(false);
  const [showThemes, setShowThemes]       = useState(false);
  const [showRarities, setShowRarities]   = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [toast, setToast]                 = useState<string | null>(null);
  const [tweaks, setTweaks] = useState<TweakState>(TWEAK_DEFAULTS as TweakState);
  const setTweak = (k: keyof TweakState, v: string) =>
    setTweaks(prev => ({ ...prev, [k]: v }));
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => save(STORAGE.cards,    cards),    [cards]);
  useEffect(() => save(STORAGE.current,  current),  [current]);
  useEffect(() => save(STORAGE.keywords, keywords), [keywords]);
  useEffect(() => save(STORAGE.themes,   themes),   [themes]);
  useEffect(() => save(STORAGE.rarities, rarities), [rarities]);

  const showToast = (msg: string) => {
    setToast(msg);
    clearTimeout((showToast as { _t?: ReturnType<typeof setTimeout> })._t);
    (showToast as { _t?: ReturnType<typeof setTimeout> })._t = setTimeout(() => setToast(null), 2000);
  };

  const onCardChange = (patch: Partial<Card>) =>
    setCurrent((c) => ({ ...c, ...patch }));

  const onSave = () => {
    setCards((all) => {
      const idx = all.findIndex((c) => c.id === current.id);
      if (idx >= 0) {
        const next = [...all];
        next[idx] = current;
        return next;
      }
      return [...all, current];
    });
    showToast('Card saved to collection');
  };

  const onNewCard = () => {
    setCurrent(BLANK_CARD(themes, rarities));
    setShowCollection(false);
    showToast('New card');
  };

  const onPickFromCollection = (id: string) => {
    const c = cards.find((x) => x.id === id);
    if (c) { setCurrent({ ...c }); setShowCollection(false); }
  };

  const onDeleteFromCollection = (id: string) =>
    setCards((all) => all.filter((c) => c.id !== id));

  const onThemeDeleted = (deletedId: string, fallbackId: string) => {
    setCards((all) => all.map((c) => c.theme === deletedId ? { ...c, theme: fallbackId } : c));
    setCurrent((c) => c.theme === deletedId ? { ...c, theme: fallbackId } : c);
  };

  const onRarityDeleted = (deletedId: string, fallbackId: string) => {
    setCards((all) => all.map((c) => c.rarity === deletedId ? { ...c, rarity: fallbackId } : c));
    setCurrent((c) => c.rarity === deletedId ? { ...c, rarity: fallbackId } : c);
  };

  const onExportPng = async () => {
    if (!cardRef.current) { showToast('Export unavailable'); return; }
    showToast('Rendering PNG…');
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: undefined,
        cacheBust: true,
      });
      const a = document.createElement('a');
      a.download = `${(current.name || 'card').replace(/[^\w-]+/g, '_')}.png`;
      a.href = dataUrl;
      a.click();
      showToast('PNG saved');
    } catch (e) {
      console.error(e);
      showToast('Export failed');
    }
  };

  const themeForCard  = themes.find((t) => t.id === current.theme) ?? themes[0];
  const rarityForCard = rarities.find((r) => r.id === current.rarity) ?? rarities[0];

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-mark"><Glyph name="book" size={18} /></div>
          <div>
            <div className="topbar-title">Sigil &amp; Sinew</div>
            <div className="topbar-sub">TCG Card Forge</div>
          </div>
        </div>
        <div className="topbar-actions">
          <button type="button" className="btn" onClick={() => setShowCollection(true)}>
            <Glyph name="collection" size={14} />
            <span>Collection</span>
            <span style={{ opacity: 0.5, marginLeft: 4 }}>{cards.length}</span>
          </button>
          <button type="button" className="btn" onClick={() => setShowKeywords(true)}>
            <Glyph name="book" size={14} /><span>Keywords</span>
          </button>
          <button type="button" className="btn" onClick={onExportPng}>
            <Glyph name="download" size={14} /><span>Export PNG</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={onSave}>
            <Glyph name="save" size={14} /><span>Save card</span>
          </button>
        </div>
      </header>

      <LeftPanel
        card={current}
        onChange={onCardChange}
        keywords={keywords}
        onOpenKeywords={() => setShowKeywords(true)}
      />

      <div className="stage">
        <div className="stage-wrap">
          <div className="stage-meta">
            <span>{themeForCard.name}</span>
            <span className="stage-meta-sep" />
            <b>{rarityForCard.name}</b>
            <span className="stage-meta-sep" />
            <span>{current.type === 'unit' ? 'Unit' : 'Spell'}</span>
          </div>
          <div ref={cardRef} className="stage-card-mount">
            <CardPreview
              card={current}
              keywords={keywords}
              themes={themes}
              rarities={rarities}
              frame={tweaks.frame}
              font={tweaks.font}
              statShape={tweaks.statShape}
              costColor={tweaks.costColor}
              attackColor={tweaks.attackColor}
              healthColor={tweaks.healthColor}
            />
          </div>
          <div className="stage-eyebrow">Live preview · hover keywords for rules</div>
        </div>
      </div>

      <RightPanel
        card={current}
        onChange={onCardChange}
        themes={themes}
        rarities={rarities}
        onManageThemes={() => setShowThemes(true)}
        onManageRarities={() => setShowRarities(true)}
        tweaks={tweaks}
        onTweakChange={setTweak}
      />

      <KeywordManager
        open={showKeywords}
        keywords={keywords}
        onClose={() => setShowKeywords(false)}
        onChange={setKeywords}
      />
      <ThemeManager
        open={showThemes}
        themes={themes}
        onClose={() => setShowThemes(false)}
        onChange={setThemes}
        onCardThemeMissing={onThemeDeleted}
      />
      <RarityManager
        open={showRarities}
        rarities={rarities}
        onClose={() => setShowRarities(false)}
        onChange={setRarities}
        onCardRarityMissing={onRarityDeleted}
      />
      <Collection
        open={showCollection}
        cards={cards}
        currentId={current.id}
        themes={themes}
        rarities={rarities}
        onClose={() => setShowCollection(false)}
        onPick={onPickFromCollection}
        onDelete={onDeleteFromCollection}
        onNew={onNewCard}
      />

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
