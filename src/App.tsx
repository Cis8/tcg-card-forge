// App.tsx — main shell. Owns: current card, saved cards, keyword library,
// faction list, rarity list, decks. All persisted to localStorage.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as htmlToImage from 'html-to-image';

import { DEFAULT_FACTIONS, DEFAULT_RARITIES, DEFAULT_KEYWORDS, SEED_CARDS } from './data';
import { CardPreview } from './card-preview';
import { LeftPanel, RightPanel } from './controls';
import { KeywordManager } from './keyword-manager';
import { FactionManager } from './faction-manager';
import { RarityManager } from './rarity-manager';
import { Collection } from './collection';
import { DeckManager } from './deck-manager';
import { DeckEditor } from './deck-editor';
import { confirmDestructiveAction } from './confirm';

import { exportSnapshot, downloadSnapshot, parseSnapshot, applySnapshot } from './io';
import { Glyph } from './glyphs';
import type { Card, Deck, DeckSettings, Faction, Rarity, Keyword, GlobalSettings } from './types';
import {
  generateId, DECK_SETTINGS_DEFAULTS, normalizeDeckSettings, deleteCardFromDecks, affectedDeckNames, normalizeDeck,
} from './deck-utils';

type AppView = { kind: 'card-editor' } | { kind: 'deck-editor'; deckId: string };
type MobileTab = 'props' | 'preview' | 'appearance';

function deckHash(deckId: string): string {
  return `#deck/${encodeURIComponent(deckId)}`;
}
function deckIdFromHash(): string | null {
  const m = window.location.hash.match(/^#deck\/(.+)$/);
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch { return null; }
}

const STORAGE = {
  cards:          'tcg.cards.v2',
  current:        'tcg.current.v2',
  keywords:       'tcg.keywords.v2',
  factions:       'tcg.factions.v2',
  rarities:       'tcg.rarities.v2',
  globalSettings: 'tcg.globalSettings.v1',
  decks:          'tcg.decks.v1',
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
  id: generateId('c'),
  type: 'unit',
  name: '',
  subtype: '',
  faction: factions[0]?.id ?? 'fire',
  pattern: 'damask',
  rarity: rarities[0]?.id ?? 'common',
  frame: 'ornate',
  cost: 1,
  attack: 1,
  health: 1,
  description: '',
  flavor: '',
  art: null,
});

const GLOBAL_SETTINGS_DEFAULTS: GlobalSettings = {
  font: 'cinzel',
  costShape:   'rhombus',
  attackShape: 'gem',
  healthShape: 'heart',
  costColor:   '#5dbce5',
  attackColor: '#7c8a99',
  healthColor: '#b21625',
  deckSettings: DECK_SETTINGS_DEFAULTS,
};

// Legacy defaults without deckSettings — used only for migration detection
const LEGACY_GLOBAL_SETTINGS_DEFAULTS: Partial<GlobalSettings> = {
  font: 'cinzel',
  costShape:   'gem',
  attackShape: 'gem',
  healthShape: 'gem',
  costColor:   '#5dbce5',
  attackColor: '#e23a3a',
  healthColor: '#cfd6dd',
};

function normalizeGlobalSettings(settings: Partial<GlobalSettings> | null | undefined): GlobalSettings {
  if (!settings) return GLOBAL_SETTINGS_DEFAULTS;
  const isLegacyDefault =
    settings.font === LEGACY_GLOBAL_SETTINGS_DEFAULTS.font &&
    settings.costShape === LEGACY_GLOBAL_SETTINGS_DEFAULTS.costShape &&
    settings.attackShape === LEGACY_GLOBAL_SETTINGS_DEFAULTS.attackShape &&
    settings.healthShape === LEGACY_GLOBAL_SETTINGS_DEFAULTS.healthShape &&
    settings.costColor === LEGACY_GLOBAL_SETTINGS_DEFAULTS.costColor &&
    settings.attackColor === LEGACY_GLOBAL_SETTINGS_DEFAULTS.attackColor &&
    settings.healthColor === LEGACY_GLOBAL_SETTINGS_DEFAULTS.healthColor;
  const base = isLegacyDefault ? GLOBAL_SETTINGS_DEFAULTS : { ...GLOBAL_SETTINGS_DEFAULTS, ...settings };
  // Always ensure deckSettings is fully populated (handles missing from localStorage)
  return {
    ...base,
    deckSettings: normalizeDeckSettings({ ...DECK_SETTINGS_DEFAULTS, ...(settings.deckSettings ?? {}) }),
  };
}

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

  const migrateCard = (c: any): Card => ({
    ...c,
    faction: c.faction ?? (c as any).theme ?? factions[0]?.id,
    frame: ['ornate', 'classic', 'inscribed'].includes(c.frame) ? c.frame : 'ornate',
  });

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
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(
    () => normalizeGlobalSettings(load<Partial<GlobalSettings>>(STORAGE.globalSettings, {}))
  );
  const setGlobalSetting = (k: keyof GlobalSettings, v: string) =>
    setGlobalSettings(prev => ({ ...prev, [k]: v }));
  const setDeckSetting = (k: keyof DeckSettings, v: number) => {
    const nextDeckSettings = normalizeDeckSettings({ ...globalSettings.deckSettings, [k]: v });
    setGlobalSettings(prev => ({ ...prev, deckSettings: nextDeckSettings }));
    // Hard-enforce maxCopiesPerCard immediately so no deck can hold illegal copies
    if (k === 'maxCopiesPerCard' && nextDeckSettings.maxCopiesPerCard !== globalSettings.deckSettings.maxCopiesPerCard) {
      const validCardIds = new Set(cards.map(c => c.id));
      setDecks(ds => ds.map(d => normalizeDeck(d, validCardIds, nextDeckSettings)));
    }
  };
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardZoom, setCardZoom] = useState(100);
  const [leftW, setLeftW] = useState(320);
  const [rightW, setRightW] = useState(320);
  const dragRef = useRef<{ side: 'left' | 'right'; startX: number; startW: number } | null>(null);

  // Mobile state
  const [mobileTab, setMobileTab] = useState<MobileTab>('preview');
  const [showOverflow, setShowOverflow] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  // Deck / view state
  const [decks, setDecks] = useState<Deck[]>(() => load<Deck[]>(STORAGE.decks, []));
  const decksRef = useRef(decks);
  useEffect(() => { decksRef.current = decks; }, [decks]);

  const [appView, setAppView] = useState<AppView>(() => {
    const deckId = deckIdFromHash();
    if (deckId) {
      try {
        const raw = localStorage.getItem(STORAGE.decks);
        const saved = raw ? (JSON.parse(raw) as Deck[]) : [];
        if (saved.find(d => d.id === deckId)) return { kind: 'deck-editor', deckId };
      } catch { /* ignore */ }
    }
    return { kind: 'card-editor' };
  });
  const [showDeckManager, setShowDeckManager] = useState(false);

  const closeOverflow = useCallback(() => setShowOverflow(false), []);

  // Sync appView → URL hash
  useEffect(() => {
    if (appView.kind === 'deck-editor') {
      const h = deckHash(appView.deckId);
      if (window.location.hash !== h) window.history.pushState(null, '', h);
    } else {
      if (window.location.hash !== '') {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [appView]);

  // Popstate + hashchange → update appView (stable listener via ref)
  useEffect(() => {
    const sync = () => {
      const deckId = deckIdFromHash();
      setAppView(
        deckId && decksRef.current.some(d => d.id === deckId)
          ? { kind: 'deck-editor', deckId }
          : { kind: 'card-editor' },
      );
    };
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  useEffect(() => {
    if (!showOverflow) return;
    const handler = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setShowOverflow(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showOverflow]);

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

  useEffect(() => save(STORAGE.cards,          cards),          [cards]);
  useEffect(() => save(STORAGE.current,        current),        [current]);
  useEffect(() => save(STORAGE.keywords,       keywords),       [keywords]);
  useEffect(() => save(STORAGE.factions,       factions),       [factions]);
  useEffect(() => save(STORAGE.rarities,       rarities),       [rarities]);
  useEffect(() => save(STORAGE.globalSettings, globalSettings), [globalSettings]);
  useEffect(() => save(STORAGE.decks,          decks),          [decks]);

  // Normalize decks once on mount against the current card collection and settings.
  // Handles data from old localStorage (missing entries, stale cardIds, excess copies).
  const mountNormalizedRef = useRef(false);
  useEffect(() => {
    if (mountNormalizedRef.current) return;
    mountNormalizedRef.current = true;
    const validCardIds = new Set(cards.map(c => c.id));
    setDecks(ds => ds.map(d => normalizeDeck(d, validCardIds, globalSettings.deckSettings)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the active deck-editor deck is deleted, fall back to card-editor
  useEffect(() => {
    if (appView.kind === 'deck-editor' && !decks.find(d => d.id === appView.deckId)) {
      setAppView({ kind: 'card-editor' });
    }
  }, [appView, decks]);

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
    if (c) { setCurrent({ ...c }); setShowCollection(false); setMobileTab('preview'); }
  };

  const onDeleteFromCollection = (id: string) => {
    const names = affectedDeckNames(decks, id);
    const list = names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3} more` : '');
    const message = names.length > 0
      ? `Delete this card? It is used in ${names.length} deck(s): ${list}. Removing it will also remove it from those decks.`
      : 'Delete this card?';
    if (!confirmDestructiveAction(message)) return;
    setCards(all => all.filter(c => c.id !== id));
    setDecks(ds => deleteCardFromDecks(ds, id));
  };

  const onFactionDeleted = (deletedId: string, fallbackId: string) => {
    setCards((all) => all.map((c) => c.faction === deletedId ? { ...c, faction: fallbackId } : c));
    setCurrent((c) => c.faction === deletedId ? { ...c, faction: fallbackId } : c);
  };

  const onRarityDeleted = (deletedId: string, fallbackId: string) => {
    setCards((all) => all.map((c) => c.rarity === deletedId ? { ...c, rarity: fallbackId } : c));
    setCurrent((c) => c.rarity === deletedId ? { ...c, rarity: fallbackId } : c);
  };

  const onExportJson = () => {
    const snapshot = exportSnapshot(cards, keywords, factions, rarities, globalSettings, decks);
    downloadSnapshot(snapshot);
    showToast('Collection exported');
  };

  const onImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);
        const result = parseSnapshot(raw, globalSettings);
        if (!result.ok) { showToast(`Import failed: ${result.error}`); return; }

        const snap = result.data;
        const summary =
          `${snap.cards.length} cards, ${snap.keywords.length} keywords, ` +
          `${snap.factions.length} factions, ${snap.rarities.length} rarities, ` +
          `${snap.decks.length} decks.\n\n` +
          'OK = Replace all · Cancel = Merge (keep existing, imported wins on conflict)';

        const replace = window.confirm(summary);
        const mode = replace ? 'replace' : 'merge';

        const next = applySnapshot(
          { cards, keywords, factions, rarities, globalSettings, decks },
          snap,
          mode,
        );
        // Compute normalized decks BEFORE any setState — prevents partial state if normalization fails
        const validCardIds = new Set(next.cards.map(c => c.id));
        const normalizedDecks = next.decks.map(d =>
          normalizeDeck(d, validCardIds, next.globalSettings.deckSettings)
        );
        // All data ready: apply atomically
        setCards(next.cards);
        setKeywords(next.keywords);
        setFactions(next.factions);
        setRarities(next.rarities);
        setGlobalSettings(next.globalSettings);
        setDecks(normalizedDecks);
        showToast(`Imported (${mode}): ${snap.cards.length} cards, ${snap.decks.length} decks`);
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

  // Deck handlers
  const onDeckChange = (deck: Deck) =>
    setDecks(ds => ds.map(d => d.id === deck.id ? deck : d));

  const onOpenDeck = (deckId: string) =>
    setAppView({ kind: 'deck-editor', deckId });

  const onCloseDeckEditor = () => {
    if (window.location.hash.startsWith('#deck/')) {
      window.history.back(); // popstate listener will call setAppView
    } else {
      setAppView({ kind: 'card-editor' });
    }
  };

  // Compute deck-editor content outside JSX to avoid hook-in-render issues
  const deckEditorContent = appView.kind === 'deck-editor' ? (() => {
    const deck = decks.find(d => d.id === appView.deckId);
    return deck ? (
      <DeckEditor
        deck={deck}
        cards={cards}
        factions={factions}
        rarities={rarities}
        keywords={keywords}
        globalSettings={globalSettings}
        onChange={onDeckChange}
        onBack={onCloseDeckEditor}
      />
    ) : null;
  })() : null;

  return (
    <div className="app"
         style={{ gridTemplateColumns: appView.kind === 'card-editor' ? `${leftW}px 6px 1fr 6px ${rightW}px` : '1fr' }}
         data-mobile-tab={mobileTab}>
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-mark"><Glyph name="book" size={18} /></div>
          <div>
            <div className="topbar-title">Sigil &amp; Sinew</div>
            <div className="topbar-sub">TCG Card Forge</div>
          </div>
        </div>
        <div className="topbar-actions">
          {/* Desktop-only buttons — hidden on mobile via CSS */}
          <div className="topbar-desktop-btns">
            <button type="button" className="btn" onClick={() => setShowDeckManager(true)}>
              <Glyph name="deck" size={14} />
              <span>Decks</span>
              {decks.length > 0 && <span style={{ opacity: 0.5, marginLeft: 4 }}>{decks.length}</span>}
            </button>
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
          </div>
          <button type="button" className="btn btn-primary" onClick={onSave}>
            <Glyph name="save" size={14} /><span>Save card</span>
          </button>
          {/* Mobile-only overflow menu — hidden on desktop via CSS */}
          <div className="topbar-mobile-overflow" ref={overflowRef}>
            <button
              type="button"
              className="btn"
              aria-label="More actions"
              aria-expanded={showOverflow}
              onClick={() => setShowOverflow(v => !v)}
            >
              <span style={{ fontSize: 18, lineHeight: 1, letterSpacing: '.05em' }}>⋯</span>
            </button>
            {showOverflow && (
              <div className="mobile-overflow-menu" role="menu">
                <button type="button" className="btn" role="menuitem"
                        onClick={() => { setShowDeckManager(true); closeOverflow(); }}>
                  <Glyph name="deck" size={14} />
                  <span>Decks</span>
                  {decks.length > 0 && <span style={{ opacity: 0.5, marginLeft: 4 }}>{decks.length}</span>}
                </button>
                <button type="button" className="btn" role="menuitem"
                        onClick={() => { setShowCollection(true); closeOverflow(); }}>
                  <Glyph name="collection" size={14} />
                  <span>Collection</span>
                  <span style={{ opacity: 0.5, marginLeft: 4 }}>{cards.length}</span>
                </button>
                <button type="button" className="btn" role="menuitem"
                        onClick={() => { setShowKeywords(true); closeOverflow(); }}>
                  <Glyph name="book" size={14} /><span>Keywords</span>
                </button>
                <button type="button" className="btn" role="menuitem"
                        onClick={() => { onExportPng(); closeOverflow(); }}>
                  <Glyph name="download" size={14} /><span>Export PNG</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {appView.kind === 'card-editor' ? (
        <>
          <LeftPanel
            card={current}
            onChange={onCardChange}
            keywords={keywords}
            onOpenKeywords={() => setShowKeywords(true)}
            deckSettings={globalSettings.deckSettings}
            onDeckSettingChange={setDeckSetting}
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
              {/* Outer div compensates layout space for the scaled card */}
              <div style={{
                width: `${Math.round(340 * cardZoom / 100 * 1.2)}px`,
                height: `${Math.round((488 + 60) * cardZoom / 100 * 1.2)}px`,
                flexShrink: 0,
                position: 'relative',
              }}>
                <div style={{
                  transform: `scale(${cardZoom / 100 * 1.2})`,
                  transformOrigin: 'top left',
                }}>
                  <div ref={cardRef} className="stage-card-mount">
                    <CardPreview
                      card={current}
                      keywords={keywords}
                      factions={factions}
                      rarities={rarities}
                      font={globalSettings.font}
                      costShape={globalSettings.costShape}
                      attackShape={globalSettings.attackShape}
                      healthShape={globalSettings.healthShape}
                      costColor={globalSettings.costColor}
                      attackColor={globalSettings.attackColor}
                      healthColor={globalSettings.healthColor}
                    />
                  </div>
                </div>
              </div>
              <div className="stage-eyebrow">Live preview · hover keywords for rules</div>
              <div className="stage-zoom-control">
                <span className="stage-zoom-label">Zoom</span>
                <input
                  type="range"
                  className="stage-zoom-slider"
                  min={50}
                  max={150}
                  step={1}
                  value={cardZoom}
                  onChange={e => setCardZoom(Number(e.target.value))}
                  aria-label="Card zoom"
                />
                <span className="stage-zoom-value">{cardZoom}%</span>
                {cardZoom !== 100 && (
                  <button
                    type="button"
                    className="stage-zoom-reset"
                    onClick={() => setCardZoom(100)}
                    title="Reset zoom"
                  >↺</button>
                )}
              </div>
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
            globalSettings={globalSettings}
            onGlobalSettingChange={setGlobalSetting}
          />
        </>
      ) : deckEditorContent}

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
        keywords={keywords}
        onClose={() => setShowCollection(false)}
        onPick={onPickFromCollection}
        onDelete={onDeleteFromCollection}
        onNew={onNewCard}
        onExportJson={onExportJson}
        onImportJson={onImportJson}
      />
      <DeckManager
        open={showDeckManager}
        decks={decks}
        cards={cards}
        factions={factions}
        deckSettings={globalSettings.deckSettings}
        onClose={() => setShowDeckManager(false)}
        onChange={setDecks}
        onOpenDeck={onOpenDeck}
      />

      {toast && <div className="toast">{toast}</div>}

      {/* Mobile bottom tab bar — only shown in card-editor view */}
      {appView.kind === 'card-editor' && (
        <nav className="mobile-tab-bar" aria-label="Main navigation">
          <button
            type="button"
            className={`mobile-tab-btn${mobileTab === 'props' ? ' on' : ''}`}
            aria-current={mobileTab === 'props' ? 'page' : undefined}
            onClick={() => setMobileTab('props')}
          >
            <Glyph name="edit" size={20} />
            <span>Properties</span>
          </button>
          <button
            type="button"
            className={`mobile-tab-btn${mobileTab === 'preview' ? ' on' : ''}`}
            aria-current={mobileTab === 'preview' ? 'page' : undefined}
            onClick={() => setMobileTab('preview')}
          >
            <Glyph name="eye" size={20} />
            <span>Preview</span>
          </button>
          <button
            type="button"
            className={`mobile-tab-btn${mobileTab === 'appearance' ? ' on' : ''}`}
            aria-current={mobileTab === 'appearance' ? 'page' : undefined}
            onClick={() => setMobileTab('appearance')}
          >
            <Glyph name="palette" size={20} />
            <span>Appearance</span>
          </button>
        </nav>
      )}
    </div>
  );
}
