// App.tsx — main shell. Owns: current card, saved cards, keyword library,
// faction list, rarity list. All persisted to localStorage.

import React, { useState, useEffect, useRef } from 'react';
import * as htmlToImage from 'html-to-image';

import { DEFAULT_FACTIONS, DEFAULT_RARITIES, DEFAULT_KEYWORDS, SEED_CARDS } from './data';
import { CardPreview } from './card-preview';
import { LeftPanel, RightPanel } from './controls';
import { KeywordManager } from './keyword-manager';
import { FactionManager } from './faction-manager';
import { RarityManager } from './rarity-manager';
import { Collection } from './collection';

import { exportSnapshot, downloadSnapshot, parseSnapshot, applySnapshot } from './io';
import { Glyph } from './glyphs';
import type { Card, Faction, Rarity, Keyword, TweakState } from './types';

const STORAGE = {
  cards:    'tcg.cards.v2',
  current:  'tcg.current.v2',
  keywords: 'tcg.keywords.v2',
  factions: 'tcg.factions.v2',
  rarities: 'tcg.rarities.v2',
} as const;

function loadWithFallback<T>(newKey: string, oldKey: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(newKey);
    if (raw) return JSON.parse(raw) as T;
    const oldRaw = localStorage.getItem(oldKey);
    return oldRaw ? (JSON.parse(oldRaw) as T) : fallback;
  } catch { return fallback; }
}

const BLANK_CARD = (factions: Faction[], rarities: Rarity[]): Card => ({
  id: `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
  type: 'unit',
  name: '',
  subtype: '',
  faction: factions[0]?.id ?? 'fire',
  pattern: 'damask',
  rarity: rarities[0]?.id ?? 'common',
  cost: 1,
  attack: 1,
  health: 1,
  description: '',
  flavor: '',
  art: null,
});

const TWEAK_DEFAULTS: TweakState = {
  frame: 'ornate',
  font: 'cinzel',
  costShape:   'gem',
  attackShape: 'gem',
  healthShape: 'gem',
  costColor:   '#5dbce5',
  attackColor: '#e23a3a',
  healthColor: '#cfd6dd',
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
  const [factions, setFactions] = useState<Faction[]>(() => loadWithFallback(STORAGE.factions, 'tcg.themes.v2', DEFAULT_FACTIONS));
  const [rarities, setRarities] = useState<Rarity[]>(() => load(STORAGE.rarities, DEFAULT_RARITIES));
  const [keywords, setKeywords] = useState<Keyword[]>(() => load(STORAGE.keywords, DEFAULT_KEYWORDS));

  const migrateCard = (c: any): Card => ({ ...c, faction: c.faction ?? (c as any).theme ?? factions[0]?.id });

  const [cards, setCards] = useState<Card[]>(() => {
    const raw = load<any[]>(STORAGE.cards, SEED_CARDS);
    return raw.map(migrateCard);
  });
  const [current, setCurrent] = useState<Card>(() => {
    const stored = load<any | null>(STORAGE.current, null);
    const base = stored ? migrateCard(stored) : migrateCard({ ...SEED_CARDS[0] });
    const validFaction = factions.find(f => f.id === base.faction) ? base.faction : factions[0]?.id ?? base.faction;
    const validRarity  = rarities.find(r => r.id === base.rarity)  ? base.rarity  : rarities[0]?.id  ?? base.rarity;
    return { ...base, faction: validFaction, rarity: validRarity };
  });

  const [showKeywords, setShowKeywords]   = useState(false);
  const [showFactions, setShowFactions]   = useState(false);
  const [showRarities, setShowRarities]   = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [toast, setToast]                 = useState<string | null>(null);
  const [tweaks, setTweaks] = useState<TweakState>(TWEAK_DEFAULTS);
  const setTweak = (k: keyof TweakState, v: string) =>
    setTweaks(prev => ({ ...prev, [k]: v }));
  const cardRef = useRef<HTMLDivElement>(null);
  const [leftW, setLeftW] = useState(320);
  const [rightW, setRightW] = useState(320);
  const dragRef = useRef<{ side: 'left' | 'right'; startX: number; startW: number } | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const newW = Math.max(240, Math.min(600, d.startW + (d.side === 'left' ? dx : -dx)));
      if (d.side === 'left') setLeftW(newW);
      else setRightW(newW);
    };
    const onUp = () => { dragRef.current = null; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  const startDrag = (side: 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { side, startX: e.clientX, startW: side === 'left' ? leftW : rightW };
  };

  useEffect(() => save(STORAGE.cards,    cards),    [cards]);
  useEffect(() => save(STORAGE.current,  current),  [current]);
  useEffect(() => save(STORAGE.keywords, keywords), [keywords]);
  useEffect(() => save(STORAGE.factions, factions), [factions]);
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
    setCurrent(BLANK_CARD(factions, rarities));
    setShowCollection(false);
    showToast('New card');
  };

  const onPickFromCollection = (id: string) => {
    const c = cards.find((x) => x.id === id);
    if (c) { setCurrent({ ...c }); setShowCollection(false); }
  };

  const onDeleteFromCollection = (id: string) =>
    setCards((all) => all.filter((c) => c.id !== id));

  const onFactionDeleted = (deletedId: string, fallbackId: string) => {
    setCards((all) => all.map((c) => c.faction === deletedId ? { ...c, faction: fallbackId } : c));
    setCurrent((c) => c.faction === deletedId ? { ...c, faction: fallbackId } : c);
  };

  const onRarityDeleted = (deletedId: string, fallbackId: string) => {
    setCards((all) => all.map((c) => c.rarity === deletedId ? { ...c, rarity: fallbackId } : c));
    setCurrent((c) => c.rarity === deletedId ? { ...c, rarity: fallbackId } : c);
  };

  const onExportJson = () => {
    const snapshot = exportSnapshot(cards, keywords, factions, rarities);
    downloadSnapshot(snapshot);
    showToast('Collection exported');
  };

  const onImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);
        const result = parseSnapshot(raw);
        if (!result.ok) { showToast(`Import failed: ${result.error}`); return; }

        const snap = result.data;
        const summary =
          `${snap.cards.length} cards, ${snap.keywords.length} keywords, ` +
          `${snap.factions.length} factions, ${snap.rarities.length} rarities.\n\n` +
          'OK = Replace all · Cancel = Merge (keep existing, imported wins on conflict)';

        const replace = window.confirm(summary);
        // User hit Escape / closed dialog — treat as cancel-the-whole-import
        // window.confirm returns false for both Cancel and close; we use Cancel as "merge".
        // To give a real abort path we check the choice separately.
        const mode = replace ? 'replace' : 'merge';

        const next = applySnapshot({ cards, keywords, factions, rarities }, snap, mode);
        setCards(next.cards);
        setKeywords(next.keywords);
        setFactions(next.factions);
        setRarities(next.rarities);
        showToast(`Imported (${mode}): ${snap.cards.length} cards`);
      } catch {
        showToast('Import failed: invalid JSON file');
      }
    };
    reader.onerror = () => showToast('Import failed: could not read file');
    reader.readAsText(file);
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

  const factionForCard = factions.find((f) => f.id === current.faction) ?? factions[0];
  const rarityForCard = rarities.find((r) => r.id === current.rarity) ?? rarities[0];

  return (
    <div className="app" style={{ gridTemplateColumns: `${leftW}px 6px 1fr 6px ${rightW}px` }}>
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
      <div
        className="resize-handle"
        onMouseDown={startDrag('left')}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize left panel"
      />

      <div className="stage">
        <div className="stage-wrap">
          <div className="stage-meta">
            <span>{factionForCard.name}</span>
            <span className="stage-meta-sep" />
            <b>{rarityForCard.name}</b>
            <span className="stage-meta-sep" />
            <span>{current.type === 'unit' ? 'Unit' : 'Spell'}</span>
          </div>
          <div ref={cardRef} className="stage-card-mount">
            <CardPreview
             card={current}
              keywords={keywords}
              factions={factions}
              rarities={rarities}
              frame={tweaks.frame}
              font={tweaks.font}
              costShape={tweaks.costShape}
              attackShape={tweaks.attackShape}
              healthShape={tweaks.healthShape}
              costColor={tweaks.costColor}
              attackColor={tweaks.attackColor}
              healthColor={tweaks.healthColor}
            />
          </div>
          <div className="stage-eyebrow">Live preview · hover keywords for rules</div>
        </div>
      </div>
      <div
        className="resize-handle"
        onMouseDown={startDrag('right')}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize right panel"
      />

      <RightPanel
        card={current}
        onChange={onCardChange}
        factions={factions}
        rarities={rarities}
        onManageFactions={() => setShowFactions(true)}
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
      <FactionManager
        open={showFactions}
        factions={factions}
        onClose={() => setShowFactions(false)}
        onChange={setFactions}
        onCardFactionMissing={onFactionDeleted}
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
        factions={factions}
        rarities={rarities}
        onClose={() => setShowCollection(false)}
        onPick={onPickFromCollection}
        onDelete={onDeleteFromCollection}
        onNew={onNewCard}
        onExportJson={onExportJson}
        onImportJson={onImportJson}
      />

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
