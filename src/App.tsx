// App.tsx — main shell. Owns: current card, saved cards, keyword library,
// faction list, rarity list, decks. All persisted via IndexedDB services.

import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { flushSync } from 'react-dom';
import * as htmlToImage from 'html-to-image';

import { DEFAULT_FACTIONS, DEFAULT_RARITIES, DEFAULT_KEYWORDS } from './data';
import { CardPreview } from './card-preview';
import { LeftPanel, RightPanel } from './controls';
import { KeywordManager } from './keyword-manager';
import { FactionManager } from './faction-manager';
import { RarityManager } from './rarity-manager';
import { Collection } from './collection';
import { DeckManager } from './deck-manager';
import { DeckEditor } from './deck-editor';
import { BatchPngExportModal } from './batch-png-export-modal';
import { confirmDestructiveAction } from './confirm';
import { useBatchPngExport } from './hooks/useBatchPngExport';
import type { BatchPngExportOptions } from './hooks/useBatchPngExport';

import { Glyph } from './glyphs';
import type { Card, CardWithArt, Deck, DeckSettings, Faction, Rarity, Keyword, GlobalSettings } from './types';
import {
  generateId, DECK_SETTINGS_DEFAULTS, normalizeDeckSettings, deleteCardFromDecks, affectedDeckNames, normalizeDeck,
} from './deck-utils';
import { useServices } from './context/ServicesContext';
import { appReducer } from './context/AppStateContext';
import type { AppState } from './context/AppStateContext';

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

const BLANK_CARD = (factions: Faction[], rarities: Rarity[]): CardWithArt => ({
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
  artId: null,
  artHandle: null,
});

export default function App(): React.ReactElement {
  const { cardService, settingsService, exportService, imageService, cardRepo, settingsRepo } = useServices();

  const [appState, dispatch] = useReducer(appReducer, null as unknown as AppState);
  const [loading, setLoading] = useState(true);

  const cards = appState?.cards ?? [];
  const current = appState?.current ?? BLANK_CARD([], []);
  const decks = appState?.decks ?? [];
  const factions = appState?.factions ?? [];
  const rarities = appState?.rarities ?? [];
  const keywords = appState?.keywords ?? [];
  const globalSettings = appState?.globalSettings ?? GLOBAL_SETTINGS_DEFAULTS;

  const [showKeywords, setShowKeywords]     = useState(false);
  const [initialKeywordEditing, setInitialKeywordEditing] = useState<string | undefined>(undefined);
  const [showFactions, setShowFactions]     = useState(false);
  const [showRarities, setShowRarities]     = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBatchPngExport, setShowBatchPngExport] = useState(false);
  const [toast, setToast]                   = useState<string | null>(null);
  const [isExporting, setIsExporting]       = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const batchRenderRef = useRef<HTMLDivElement>(null);
  const fontEmbedCSSRef = useRef<string | null | undefined>(undefined);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [cardZoom, setCardZoom] = useState(100);
  const [leftW, setLeftW] = useState(320);
  const [rightW, setRightW] = useState(320);
  const dragRef = useRef<{ side: 'left' | 'right'; startX: number; startW: number } | null>(null);

  // Mobile state
  const [mobileTab, setMobileTab] = useState<MobileTab>('preview');
  const [showOverflow, setShowOverflow] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);
  const [viewportW, setViewportW] = useState(() => window.innerWidth);

  // Deck / view state
  const decksRef = useRef(decks);
  useEffect(() => { decksRef.current = decks; }, [decks]);

  const [appView, setAppView] = useState<AppView>({ kind: 'card-editor' });
  const [showDeckManager, setShowDeckManager] = useState(false);

  const batchExport = useBatchPngExport(batchRenderRef);

  // Async initialization on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [loadedCards, settings] = await Promise.all([
        cardService.loadAll(),
        settingsService.load(),
      ]);
      if (cancelled) return;
      const { factions: loadedFactions, rarities: loadedRarities, keywords: loadedKeywords, globalSettings: gs, decks: loadedDecks, currentCardId } = settings;
      const normalizedGS = settingsService.normalizeGlobalSettings(gs, GLOBAL_SETTINGS_DEFAULTS);
      // Find current card from loaded cards, or create blank
      const currentCard = currentCardId
        ? (loadedCards.find(c => c.id === currentCardId) ?? BLANK_CARD(loadedFactions, loadedRarities))
        : (loadedCards[0] ?? BLANK_CARD(loadedFactions, loadedRarities));
      // Normalize decks
      const validCardIds = new Set(loadedCards.map(c => c.id));
      const normalizedDecks = loadedDecks.map(d => normalizeDeck(d, validCardIds, normalizedGS.deckSettings));

      const resolvedFactions = loadedFactions.length > 0 ? loadedFactions : DEFAULT_FACTIONS;
      const resolvedRarities = loadedRarities.length > 0 ? loadedRarities : DEFAULT_RARITIES;
      const resolvedKeywords = loadedKeywords.length > 0 ? loadedKeywords : DEFAULT_KEYWORDS;

      dispatch({
        type: 'LOADED',
        payload: {
          cards: loadedCards,
          current: currentCard,
          decks: normalizedDecks,
          factions: resolvedFactions,
          rarities: resolvedRarities,
          keywords: resolvedKeywords,
          globalSettings: normalizedGS,
        },
      });

      // Sync appView from URL hash after decks are loaded
      const deckId = deckIdFromHash();
      if (deckId && normalizedDecks.find(d => d.id === deckId)) {
        setAppView({ kind: 'deck-editor', deckId });
      }

      setLoading(false);
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeOverflow = useCallback(() => setShowOverflow(false), []);

  // Track viewport width reactively (handles orientation changes on mobile).
  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Card bleed amounts in natural card coordinates (px).
  // These are the distances each element protrudes outside the 340×488 card box.
  const CARD_W = 340, CARD_H = 488;
  const BLEED_TOP = 12, BLEED_LEFT = 10, BLEED_RIGHT = 8, BLEED_BOTTOM = 8;

  // Effective card scale.
  // Mobile: fit the full bleed-box (340 + 10 + 8 = 358 px wide) within the
  //         available stage content width (viewport − 32 px h-padding).
  // Desktop: user zoom × 1.2 boost.
  const isMobile = viewportW <= 767;
  const cardScale = isMobile
    ? Math.min(1.2, (viewportW - 32) / (CARD_W + BLEED_LEFT + BLEED_RIGHT))
    : cardZoom / 100 * 1.2;

  // Outer div: layout placeholder sized to the full bleed-box.
  // Inner div: absolutely positioned inside, offset so every bleed element
  //            stays within the outer div (no upward/leftward layout overflow).
  const outerW   = (CARD_W + BLEED_LEFT + BLEED_RIGHT) * cardScale;
  const outerH   = (CARD_H + BLEED_TOP  + BLEED_BOTTOM) * cardScale;
  const innerTop  = BLEED_TOP  * cardScale; // room for cost-gem above card
  const innerLeft = BLEED_LEFT * cardScale; // room for cost-gem left of card

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

  const onCardChange = (patch: Partial<CardWithArt>) =>
    dispatch({ type: 'SET_CURRENT', payload: { ...current, ...patch } });

  const onSave = async () => {
    const prevArtId = appState?.cards.find(c => c.id === current.id)?.artId;
    await cardService.save(current, prevArtId !== current.artId ? prevArtId ?? undefined : undefined);
    await settingsService.saveCurrentCardId(current.id);
    dispatch({ type: 'CARD_SAVED', payload: current });
    showToast('Card saved to collection');
  };

  const onNewCard = () => {
    const blank = BLANK_CARD(factions, rarities);
    dispatch({ type: 'SET_CURRENT', payload: blank });
    setShowCollection(false);
    showToast('New card');
  };

  const onPickFromCollection = (id: string) => {
    const c = appState?.cardMap.get(id);
    if (c) {
      dispatch({ type: 'SET_CURRENT', payload: c });
      setShowCollection(false);
      setMobileTab('preview');
      settingsService.saveCurrentCardId(id);
    }
  };

  const onDeleteFromCollection = async (id: string) => {
    const names = affectedDeckNames(decks, id);
    const list = names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3} more` : '');
    const message = names.length > 0
      ? `Delete this card? It is used in ${names.length} deck(s): ${list}. Removing it will also remove it from those decks.`
      : 'Delete this card?';
    if (!confirmDestructiveAction(message)) return;
    await cardService.delete(id);
    const newDecks = deleteCardFromDecks(decks, id);
    await settingsService.saveDecks(newDecks);
    dispatch({ type: 'CARD_DELETED', payload: { id } });
    dispatch({ type: 'DECKS_CHANGED', payload: newDecks });
  };

  const onFactionDeleted = async (deletedId: string, fallbackId: string) => {
    await cardService.bulkPatchFaction(deletedId, fallbackId);
    const updatedCards = await cardService.loadAll();
    const updatedCurrent = current.faction === deletedId
      ? { ...current, faction: fallbackId }
      : current;
    dispatch({ type: 'LOADED', payload: { ...appState!, cards: updatedCards, current: updatedCurrent } });
  };

  const onRarityDeleted = async (deletedId: string, fallbackId: string) => {
    await cardService.bulkPatchRarity(deletedId, fallbackId);
    const updatedCards = await cardService.loadAll();
    const updatedCurrent = current.rarity === deletedId
      ? { ...current, rarity: fallbackId }
      : current;
    dispatch({ type: 'LOADED', payload: { ...appState!, cards: updatedCards, current: updatedCurrent } });
  };

  const onExportJson = () => setShowExportModal(true);

  const onFactionsChange = async (f: Faction[]) => {
    await settingsService.saveFactions(f);
    dispatch({ type: 'FACTIONS_CHANGED', payload: f });
  };

  const onRaritiesChange = async (r: Rarity[]) => {
    await settingsService.saveRarities(r);
    dispatch({ type: 'RARITIES_CHANGED', payload: r });
  };

  const onKeywordsChange = async (kw: Keyword[]) => {
    await settingsService.saveKeywords(kw);
    dispatch({ type: 'KEYWORDS_CHANGED', payload: kw });
  };

  const onGlobalSettingsChange = async (gs: GlobalSettings) => {
    await settingsService.saveGlobalSettings(gs);
    dispatch({ type: 'GLOBAL_SETTINGS_CHANGED', payload: gs });
  };

  const setGlobalSetting = (k: keyof GlobalSettings, v: string) =>
    onGlobalSettingsChange({ ...globalSettings, [k]: v });

  const setDeckSetting = (k: keyof DeckSettings, v: number) => {
    const nextDeckSettings = normalizeDeckSettings({ ...globalSettings.deckSettings, [k]: v });
    const nextGS = { ...globalSettings, deckSettings: nextDeckSettings };
    onGlobalSettingsChange(nextGS);
    if (k === 'maxCopiesPerCard') {
      const validCardIds = new Set(cards.map(c => c.id));
      const normalizedDecks = decks.map(d => normalizeDeck(d, validCardIds, nextDeckSettings));
      onDecksChange(normalizedDecks);
    }
  };

  const doExport = async (compact: boolean) => {
    setShowExportModal(false);
    showToast(compact ? 'Compressing images…' : 'Building snapshot…');
    const snapshot = await exportService.buildSnapshot(
      cards, keywords, factions, rarities, globalSettings, decks,
      compact ? { compact: true } : undefined,
    );
    exportService.downloadSnapshot(snapshot);
    showToast('Collection exported');
  };

  const onImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);
        const payload = exportService.detectImport(raw, globalSettings);
        if (payload.kind === 'unknown') { showToast(`Import failed: ${payload.error}`); return; }

        if (payload.kind === 'snapshot') {
          const snap = payload.data;
          const summary = `${snap.cards.length} cards, ${snap.keywords.length} keywords, ` +
            `${snap.factions.length} factions, ${snap.rarities.length} rarities, ${snap.decks.length} decks.\n\n` +
            'OK = Replace all · Cancel = Merge';
          const replace = window.confirm(summary);
          const result = await exportService.applySnapshot(
            { cards: cardRepo, settings: settingsRepo },
            imageService,
            snap,
            replace ? 'replace' : 'merge',
          );
          const validCardIds = new Set(result.cards.map(c => c.id));
          const normalizedDecks = result.decks.map(d => normalizeDeck(d, validCardIds, result.globalSettings.deckSettings));
          dispatch({ type: 'LOADED', payload: { ...result, decks: normalizedDecks, current: result.cards[0] ?? current } });
          showToast(`Imported (${replace ? 'replace' : 'merge'}): ${result.cards.length} cards, ${normalizedDecks.length} decks`);
          return;
        }

        if (payload.kind === 'card') {
          const cardExports = payload.data;
          if (!window.confirm(`Import ${cardExports.length} card(s)?\n\nOK = Add to collection`)) return;
          const newCards: CardWithArt[] = [];
          for (const ce of cardExports) {
            const artId = ce.art ? (await imageService.storeFromDataUrl(ce.art)).id : null;
            const artHandle = artId ? await imageService.resolve(artId) : null;
            const card: CardWithArt = { ...ce as unknown as Card, artId, artHandle };
            await cardService.save(card);
            newCards.push(card);
          }
          // Merge with existing cards
          const existing = cards.filter(c => !newCards.some(nc => nc.id === c.id));
          dispatch({ type: 'LOADED', payload: { ...appState!, cards: [...existing, ...newCards] } });
          showToast(`Imported ${newCards.length} card(s)`);
          return;
        }

        if (payload.kind === 'deck') {
          const incoming = payload.data;
          const validCardIds = new Set(cards.map(c => c.id));
          const missingCount = incoming.reduce((n, d) =>
            n + d.entries.filter(e => !validCardIds.has(e.cardId)).length, 0);
          let msg = `Import ${incoming.length} deck(s)?`;
          if (missingCount > 0) msg += `\n\n⚠ ${missingCount} card reference(s) not in collection will be removed.`;
          if (!window.confirm(msg + '\n\nOK = Add/merge')) return;
          const normalized = incoming.map(d => normalizeDeck(d, validCardIds, globalSettings.deckSettings));
          const merged = [...decks.filter(d => !normalized.some(n => n.id === d.id)), ...normalized];
          await settingsService.saveDecks(merged);
          dispatch({ type: 'DECKS_CHANGED', payload: merged });
          showToast(`Imported ${incoming.length} deck(s)`);
        }
      } catch { showToast('Import failed: invalid JSON file'); }
    };
    reader.onerror = () => showToast('Import failed: could not read file');
    reader.readAsText(file);
  };

  const buildFontEmbedCSS = async (): Promise<string | null> => {
    if (fontEmbedCSSRef.current !== undefined) return fontEmbedCSSRef.current;
    const googleFontsUrl = document.querySelector<HTMLLinkElement>('link[href*="fonts.googleapis.com"]')?.href;
    if (!googleFontsUrl) { fontEmbedCSSRef.current = null; return null; }
    try {
      const cssRes = await fetch(googleFontsUrl);
      if (!cssRes.ok) throw new Error(`${cssRes.status}`);
      let css = await cssRes.text();
      const fontUrls = [...css.matchAll(/url\(([^)]+)\)/g)].map(m => m[1].replace(/['"]/g, ''));
      await Promise.all(fontUrls.map(async (url) => {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          const dataUri = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          css = css.replaceAll(url, dataUri);
        } catch { /* leave URL as-is if individual font fetch fails */ }
      }));
      fontEmbedCSSRef.current = css;
      return css;
    } catch (e) {
      console.warn('Font pre-fetch failed, falling back to skipFonts:', e);
      fontEmbedCSSRef.current = null;
      return null;
    }
  };

  const onExportPng = async () => {
    if (!cardRef.current) { showToast('Export unavailable'); return; }
    showToast('Rendering PNG…');
    flushSync(() => setIsExporting(true));
    try {
      const fontEmbedCSS = await buildFontEmbedCSS();
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: undefined,
        // Expand canvas to the full bleed-box so cost/stat gems aren't clipped.
        // Shifting the card content inward by the bleed amounts puts overflowing
        // elements (anchored at negative coords) within the canvas bounds.
        width: CARD_W + BLEED_LEFT + BLEED_RIGHT,
        height: CARD_H + BLEED_TOP + BLEED_BOTTOM,
        style: { marginLeft: `${BLEED_LEFT}px`, marginTop: `${BLEED_TOP}px` },
        ...(fontEmbedCSS != null ? { fontEmbedCSS } : { skipFonts: true }),
      });
      const a = document.createElement('a');
      a.download = `${(current.name || 'card').replace(/[^\w-]+/g, '_')}.png`;
      a.href = dataUrl;
      a.click();
      showToast('PNG saved');
    } catch (e) {
      console.error(e);
      showToast('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const onStartBatchExport = async (options: BatchPngExportOptions) => {
    const fontEmbedCSS = await buildFontEmbedCSS();
    batchExport.start(cards, options, fontEmbedCSS, factions);
  };

  const factionForCard = factions.find((f) => f.id === current.faction) ?? factions[0];
  const rarityForCard = current.rarity ? rarities.find((r) => r.id === current.rarity) : undefined;

  // Deck handlers
  const onDeckChange = async (deck: Deck) => {
    const newDecks = decks.map(d => d.id === deck.id ? deck : d);
    await settingsService.saveDecks(newDecks);
    dispatch({ type: 'DECKS_CHANGED', payload: newDecks });
  };

  const onDecksChange = async (newDecks: Deck[]) => {
    dispatch({ type: 'DECKS_CHANGED', payload: newDecks });
    await settingsService.saveDecks(newDecks);
  };

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
        onExportDeck={(d) => exportService.downloadDeck(d)}
      />
    ) : null;
  })() : null;

  if (loading) {
    return (
      <div className="app" style={{ gridTemplateColumns: '1fr', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', opacity: 0.5, fontFamily: 'Cinzel, serif' }}>Loading…</div>
      </div>
    );
  }

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
            <button type="button" className="btn" onClick={onExportJson}>
              <Glyph name="download" size={14} /><span>Export JSON</span>
            </button>
            <button type="button" className="btn" onClick={() => importFileRef.current?.click()}>
              <Glyph name="upload" size={14} /><span>Import JSON</span>
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
                        onClick={() => { onExportJson(); closeOverflow(); }}>
                  <Glyph name="download" size={14} /><span>Export JSON</span>
                </button>
                <button type="button" className="btn" role="menuitem"
                        onClick={() => { importFileRef.current?.click(); closeOverflow(); }}>
                  <Glyph name="upload" size={14} /><span>Import JSON</span>
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
      <input
        ref={importFileRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportJson(f); e.target.value = ''; }}
      />

      {appView.kind === 'card-editor' ? (
        <>
          <LeftPanel
            card={current}
            onChange={onCardChange}
            keywords={keywords}
            cards={cards}
            factions={factions}
            rarities={rarities}
            globalSettings={globalSettings}
            onOpenKeywords={(kwId) => { setInitialKeywordEditing(kwId); setShowKeywords(true); }}
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
                <span>{factionForCard?.name}</span>
                <span className="stage-meta-sep" />
                <b>{rarityForCard?.name}</b>
                <span className="stage-meta-sep" />
                <span>{current.type === 'unit' ? 'Unit' : 'Spell'}</span>
              </div>
              {/* Outer div compensates layout space for the scaled card including bleed */}
              <div style={{
                width: `${outerW}px`,
                height: `${outerH}px`,
                flexShrink: 0,
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  top: `${innerTop}px`,
                  left: `${innerLeft}px`,
                  transform: `scale(${cardScale})`,
                  transformOrigin: 'top left',
                  width: `${CARD_W}px`,
                }}>
                  <div ref={cardRef} className="stage-card-mount">
                    <CardPreview
                      card={current}
                      keywords={keywords}
                      cards={cards}
                      factions={factions}
                      rarities={rarities}
                      font={globalSettings.font}
                      costShape={globalSettings.costShape}
                      attackShape={globalSettings.attackShape}
                      healthShape={globalSettings.healthShape}
                      costColor={globalSettings.costColor}
                      attackColor={globalSettings.attackColor}
                      healthColor={globalSettings.healthColor}
                      hidePlaceholder={isExporting}
                      onEditCard={(id) => {
                        const c = appState?.cardMap.get(id);
                        if (c) {
                          dispatch({ type: 'SET_CURRENT', payload: c });
                          setMobileTab('preview');
                          void settingsService.saveCurrentCardId(id);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="stage-eyebrow">Live preview · hover keywords for rules · click card refs to edit</div>
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
        cards={cards}
        factions={factions}
        rarities={rarities}
        globalSettings={globalSettings}
        initialEditing={initialKeywordEditing}
        onClose={() => { setShowKeywords(false); setInitialKeywordEditing(undefined); }}
        onChange={onKeywordsChange}
      />
      <FactionManager
        open={showFactions}
        factions={factions}
        onClose={() => setShowFactions(false)}
        onChange={onFactionsChange}
        onCardFactionMissing={onFactionDeleted}
      />
      <RarityManager
        open={showRarities}
        rarities={rarities}
        onClose={() => setShowRarities(false)}
        onChange={onRaritiesChange}
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
        onExportCard={(card) => exportService.downloadCard(card as CardWithArt)}
        onExportAllPng={() => { setShowCollection(false); setShowBatchPngExport(true); }}
      />
      <DeckManager
        open={showDeckManager}
        decks={decks}
        cards={cards}
        factions={factions}
        deckSettings={globalSettings.deckSettings}
        onClose={() => setShowDeckManager(false)}
        onChange={onDecksChange}
        onOpenDeck={onOpenDeck}
        onExportDeck={(d) => exportService.downloadDeck(d)}
      />

      {showExportModal && (
        <div className="modal-scrim" onClick={() => setShowExportModal(false)}>
          <div className="modal export-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-eyebrow">Export</div>
                <h2 className="modal-title">Export JSON</h2>
              </div>
            </div>
            <div className="export-modal-body">
              <p className="export-modal-desc">
                Choose how to handle card images in the exported file.
              </p>
              <div className="export-modal-actions">
                <button type="button" className="btn export-modal-btn" onClick={() => doExport(false)}>
                  <Glyph name="download" size={14}/>
                  <div className="export-modal-btn-text">
                    <span>Full quality</span>
                    <span className="export-modal-btn-hint">1920px · JPEG 85% — ideal for backup</span>
                  </div>
                </button>
                <button type="button" className="btn export-modal-btn" onClick={() => doExport(true)}>
                  <Glyph name="download" size={14}/>
                  <div className="export-modal-btn-text">
                    <span>Compact</span>
                    <span className="export-modal-btn-hint">800px · JPEG 70% — smaller file for sharing</span>
                  </div>
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowExportModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Off-screen container for batch PNG rendering — must stay in the DOM */}
      <div
        style={{ position: 'fixed', left: -9999, top: -9999, width: `${CARD_W}px`, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <div ref={batchRenderRef} className="stage-card-mount">
          {batchExport.cardToRender && (
            <CardPreview
              card={batchExport.cardToRender}
              keywords={keywords}
              cards={cards}
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
          )}
        </div>
      </div>

      <BatchPngExportModal
        open={showBatchPngExport}
        cardCount={cards.length}
        state={batchExport.state}
        onStart={onStartBatchExport}
        onCancel={batchExport.cancel}
        onClose={() => { setShowBatchPngExport(false); batchExport.reset(); }}
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
