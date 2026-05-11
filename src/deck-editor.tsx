import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CardPreview, CardHoverPreview } from './card-preview';
import { CollectionFilterBar } from './collection-filter-bar';
import { Glyph } from './glyphs';
import type { CardWithArt, Deck, DeckSettings, Faction, GlobalSettings, Keyword, Rarity } from './types';
import {
  addCardToDeck, removeCardFromDeck,
  getDeckTotal, getDeckFactions, getDeckCostCurve, validateDeck, sortCardsByCost,
} from './deck-utils';
import {
  type CollectionFilters,
  applyFilters, createEmptyFilters,
} from './collection-filter';

// Picker grid metrics — must match deck.css / mobile.css
const PICKER_CARD_W = 340;
const DESKTOP_BP = 768;
function pickerMetrics(containerW: number) {
  const mobile = containerW < DESKTOP_BP;
  const cols = mobile ? 2 : Math.max(1, Math.floor((containerW - 48 + 16) / (PICKER_CARD_W + 16)));
  return {
    cols,
    // Mobile: 1fr so card wraps fill the column width (wrap handles overflow+scale).
    // Desktop: auto so each column is sized to the card's natural 340px width.
    colTemplate: mobile ? `repeat(${cols}, 1fr)` : `repeat(${cols}, auto)`,
    itemH:   mobile ? 225 : 488,
    gap:     mobile ? 8   : 16,
    padH:    mobile ? 8   : 24,
    padV:    mobile ? 8   : 16,
  };
}

function usePickerGrid(scrollRef: React.RefObject<HTMLDivElement | null>) {
  const [containerW, setContainerW] = useState(700);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setContainerW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [scrollRef]);
  return pickerMetrics(containerW);
}

export interface DeckEditorProps {
  deck: Deck;
  cards: CardWithArt[];
  factions: Faction[];
  rarities: Rarity[];
  keywords: Keyword[];
  globalSettings: GlobalSettings;
  onChange: (deck: Deck) => void;
  onBack: () => void;
  onExportDeck: (deck: Deck) => void;
}

interface DeckCardRowProps {
  card: CardWithArt;
  cards: CardWithArt[];
  factions: Faction[];
  rarities: Rarity[];
  keywords: Keyword[];
  quantity: number;
  maxCopies: number;
  globalSettings: GlobalSettings;
  onAdd: () => void;
  onRemove: () => void;
}

function DeckCardRow({ card, cards, factions, rarities, keywords, quantity, maxCopies, globalSettings, onAdd, onRemove }: DeckCardRowProps): React.ReactElement {
  const faction = factions.find(f => f.id === card.faction) ?? factions[0];
  const { font, costShape, attackShape, healthShape, costColor, attackColor, healthColor } = globalSettings;
  return (
    <CardHoverPreview
      card={card} cards={cards} factions={factions} rarities={rarities} keywords={keywords}
      font={font} costShape={costShape} attackShape={attackShape} healthShape={healthShape}
      costColor={costColor} attackColor={attackColor} healthColor={healthColor}
    >
      <div className="deck-card-row">
        {faction && (
          <span className="deck-card-row-glyph" style={{ color: faction.primary }}>
            <Glyph name={faction.glyph} size={13} />
          </span>
        )}
        <span className="deck-card-row-cost">{card.cost}</span>
        <span className="deck-card-row-name">{card.name || 'Untitled'}</span>
        <div className="deck-card-row-qty">
          <button type="button" className="qty-btn" onClick={onRemove} title="Remove one">−</button>
          <span className="qty-value">×{quantity}</span>
          <button type="button" className="qty-btn" onClick={onAdd} disabled={quantity >= maxCopies} title="Add one">+</button>
        </div>
      </div>
    </CardHoverPreview>
  );
}

interface DeckPickerCardProps {
  card: CardWithArt;
  cards: CardWithArt[];
  factions: Faction[];
  rarities: Rarity[];
  keywords: Keyword[];
  quantity: number;
  maxCopies: number;
  globalSettings: GlobalSettings;
  onAdd: () => void;
  onLongPress: (card: CardWithArt) => void;
}

function DeckPickerCard({ card, cards, factions, rarities, keywords, quantity, maxCopies, globalSettings, onAdd, onLongPress }: DeckPickerCardProps): React.ReactElement {
  const atMax = quantity >= maxCopies;
  const { font, costShape, attackShape, healthShape, costColor, attackColor, healthColor } = globalSettings;

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  useEffect(() => () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }, []);

  const handleTouchStart = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      longPressTimer.current = null;
      onLongPress(card);
    }, 500);
  }, [card, onLongPress]);

  const handleTouchEnd = useCallback(() => cancelLongPress(), [cancelLongPress]);
  const handleTouchMove = useCallback(() => cancelLongPress(), [cancelLongPress]);

  const handleClick = useCallback(() => {
    if (didLongPress.current) { didLongPress.current = false; return; }
    if (!atMax) onAdd();
  }, [atMax, onAdd]);

  return (
    <div
      className={`deck-picker-card-wrap${atMax ? ' at-max' : ''}`}
      role="button"
      tabIndex={atMax ? -1 : 0}
      onClick={handleClick}
      onKeyDown={e => e.key === 'Enter' && !atMax && onAdd()}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      title={atMax ? `Max ${maxCopies} copies` : `Add ${card.name || 'card'} to deck`}
    >
      <div className="deck-picker-card-inner">
        <CardPreview
          card={card} cards={cards} factions={factions} rarities={rarities} keywords={keywords}
          font={font} costShape={costShape} attackShape={attackShape} healthShape={healthShape}
          costColor={costColor} attackColor={attackColor} healthColor={healthColor}
        />
      </div>
      {quantity > 0 && (
        <div className={`deck-picker-card-badge${atMax ? ' at-max' : ''}`}>
          ×{quantity}{atMax ? ' MAX' : ''}
        </div>
      )}
    </div>
  );
}

export function DeckEditor({ deck, cards, factions, rarities, keywords, globalSettings, onChange, onBack, onExportDeck }: DeckEditorProps): React.ReactElement {
  const deckSettings: DeckSettings = globalSettings.deckSettings;
  const [filters, setFilters] = useState<CollectionFilters>(createEmptyFilters);
  const [showDesc, setShowDesc] = useState(false);
  const [showStats, setShowStats] = useState(false);   // collapsed by default
  const [showFilters, setShowFilters] = useState(true); // expanded by default
  const [mobileTab, setMobileTab] = useState<'cards' | 'stats'>('cards');
  const [touchPreviewCard, setTouchPreviewCard] = useState<CardWithArt | null>(null);

  const filteredCards = useMemo(() => sortCardsByCost(applyFilters(cards, filters) as CardWithArt[]), [cards, filters]);

  const pickerScrollRef = useRef<HTMLDivElement>(null);
  const { cols: pickerCols, colTemplate, itemH, gap: pickerGap, padH, padV } = usePickerGrid(pickerScrollRef);

  const pickerRows = useMemo(() => {
    const result: CardWithArt[][] = [];
    for (let i = 0; i < filteredCards.length; i += pickerCols) result.push(filteredCards.slice(i, i + pickerCols));
    return result;
  }, [filteredCards, pickerCols]);

  const pickerVirtualizer = useVirtualizer({
    count: pickerRows.length,
    getScrollElement: () => pickerScrollRef.current,
    estimateSize: () => itemH + pickerGap,
    overscan: 2,
    paddingStart: padV,
    paddingEnd: 24,
  });

  const deckQtyByCardId = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of deck.entries) map.set(entry.cardId, entry.quantity);
    return map;
  }, [deck.entries]);

  const sortedEntries = useMemo(() =>
    [...deck.entries].sort((a, b) => {
      const ca = cards.find(c => c.id === a.cardId);
      const cb = cards.find(c => c.id === b.cardId);
      const aToken = ca != null && ca.rarity == null;
      const bToken = cb != null && cb.rarity == null;
      if (aToken !== bToken) return aToken ? 1 : -1;
      return (ca?.cost ?? 0) - (cb?.cost ?? 0);
    }),
    [deck.entries, cards],
  );

  const total = getDeckTotal(deck);
  const deckFactions = getDeckFactions(deck, cards, factions);
  const issues = validateDeck(deck, cards, deckSettings);
  const costCurve = getDeckCostCurve(deck, cards);
  const maxCost = Math.max(0, ...costCurve.values());
  const hasIssues = issues.length > 0;

  const handleAdd = (cardId: string) => onChange(addCardToDeck(deck, cardId, deckSettings));
  const handleRemove = (cardId: string) => onChange(removeCardFromDeck(deck, cardId));
  const handleNameChange = (name: string) => onChange({ ...deck, name });
  const handleDescChange = (description: string) => onChange({ ...deck, description });

  const toggleStats = () => {
    if (showStats) setShowDesc(false); // reset desc edit when collapsing
    setShowStats(v => !v);
  };

  const previewProps = {
    factions, rarities, keywords, cards,
    font: globalSettings.font,
    costShape: globalSettings.costShape,
    attackShape: globalSettings.attackShape,
    healthShape: globalSettings.healthShape,
    costColor: globalSettings.costColor,
    attackColor: globalSettings.attackColor,
    healthColor: globalSettings.healthColor,
  };

  return (
    <>
      <div className="deck-editor" data-mobile-tab={mobileTab}>
        {/* ── Mobile-only navigation bar (hidden on desktop via CSS) ── */}
        <div className="deck-editor-mobile-bar">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
          <span className="deck-editor-title-sm">{deck.name || 'Untitled Deck'}</span>
          <div className="deck-editor-tab-switch">
            <button
              type="button"
              className={`deck-tab-btn${mobileTab === 'cards' ? ' on' : ''}`}
              onClick={() => setMobileTab('cards')}
            >Cards</button>
            <button
              type="button"
              className={`deck-tab-btn${mobileTab === 'stats' ? ' on' : ''}`}
              onClick={() => setMobileTab('stats')}
            >Browse</button>
          </div>
        </div>

        {/* ── Left panel: deck card list ── */}
        <aside className="deck-editor-left">
          <div className="deck-editor-left-header">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
            <span className="deck-editor-title-sm">{deck.name || 'Untitled Deck'}</span>
          </div>

          <div className="deck-editor-section-label">Deck cards</div>
          <div className="deck-card-list">
            {deck.entries.length === 0 && (
              <div className="deck-empty-state">
                <Glyph name="deck" size={28} />
                <span>No cards yet — browse on the right</span>
              </div>
            )}
            {sortedEntries.map(entry => {
              const card = cards.find(c => c.id === entry.cardId);
              if (!card) return null;
              return (
                <DeckCardRow
                  key={entry.cardId}
                  card={card}
                  cards={cards}
                  factions={factions}
                  rarities={rarities}
                  keywords={keywords}
                  quantity={entry.quantity}
                  maxCopies={deckSettings.maxCopiesPerCard}
                  globalSettings={globalSettings}
                  onAdd={() => handleAdd(entry.cardId)}
                  onRemove={() => handleRemove(entry.cardId)}
                />
              );
            })}
          </div>
        </aside>

        {/* ── Right panel ── */}
        <main className="deck-editor-right">
          {/* Persistent header: name + count + stats toggle */}
          <div className="deck-right-header">
            <input
              className="deck-name-input"
              type="text"
              value={deck.name}
              placeholder="Deck name…"
              onChange={e => handleNameChange(e.target.value)}
            />
            <div className="deck-total-badge">
              <span className={total >= deckSettings.minDeckSize ? 'valid' : 'pending'}>{total}</span>
              <span className="deck-total-sep">/</span>
              <span className="deck-total-max">{deckSettings.maxDeckSize}</span>
              <span className="deck-total-label">cards</span>
            </div>
            <button
              type="button"
              className={`deck-stats-toggle-btn${hasIssues && !showStats ? ' has-issues' : ''}`}
              onClick={toggleStats}
              title={showStats ? 'Collapse stats' : 'Expand stats'}
            >
              {hasIssues && !showStats ? '⚠ ' : ''}Stats {showStats ? '▲' : '▼'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              title="Export deck as JSON"
              onClick={() => onExportDeck(deck)}
            >
              <Glyph name="download" size={14}/><span>Export JSON</span>
            </button>
          </div>

          {/* Collapsible stats: desc, factions, issues, cost curve */}
          {showStats && (
            <div className="deck-right-stats">
              <div className="deck-desc-row">
                {!showDesc ? (
                  <p className="deck-desc-display">
                    {deck.description || <span className="deck-desc-placeholder">No description</span>}
                  </p>
                ) : (
                  <textarea
                    className="deck-desc-input"
                    rows={2}
                    placeholder="Deck description…"
                    value={deck.description}
                    onChange={e => handleDescChange(e.target.value)}
                    autoFocus
                  />
                )}
                <button
                  type="button"
                  className="deck-desc-toggle-btn"
                  onClick={() => setShowDesc(v => !v)}
                >
                  ✎ {showDesc ? 'Done' : 'Edit desc'}
                </button>
              </div>

              <div className="deck-factions-row">
                {deckFactions.map(f => (
                  <span key={f.id} className="deck-faction-badge" style={{ borderColor: f.primary, color: f.primary }}>
                    <Glyph name={f.glyph} size={12} />{f.name}
                  </span>
                ))}
                {deckFactions.length === 0 && <span className="deck-faction-badge-empty">No factions</span>}
              </div>

              {issues.length > 0 && (
                <div className="deck-issues">
                  {issues.map((issue, i) => (
                    <div key={i} className={`deck-issue deck-issue--${issue.kind}`}>{issue.message}</div>
                  ))}
                </div>
              )}
              {issues.length === 0 && total > 0 && (
                <div className="deck-issue deck-issue--ok">Deck is valid ✓</div>
              )}

              {total > 0 && (
                <div className="deck-cost-curve">
                  <div className="deck-cost-curve-label">Cost curve</div>
                  <div className="deck-cost-curve-bars">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(cost => {
                      const count = costCurve.get(cost) ?? 0;
                      const pct = maxCost > 0 ? (count / maxCost) * 100 : 0;
                      return (
                        <div key={cost} className="deck-curve-col">
                          {count > 0 && <div className="deck-curve-count">{count}</div>}
                          <div className="deck-curve-bar" style={{ height: `${Math.max(pct, 4)}%`, minHeight: count > 0 ? 4 : 0 }} />
                          <div className="deck-curve-label">{cost === 10 ? '10+' : cost}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Card picker: always visible below stats */}
          <div className="deck-picker-panel">
            <div className="deck-picker-panel-header">
              <span className="deck-editor-section-label-inline">Add cards</span>
              <button
                type="button"
                className="deck-filter-toggle-btn"
                onClick={() => setShowFilters(v => !v)}
              >
                {showFilters ? '▲' : '▼'} Filters
              </button>
            </div>
            {showFilters && (
              <CollectionFilterBar
                filters={filters}
                factions={factions}
                keywords={keywords}
                rarities={rarities}
                onChange={setFilters}
                onClear={() => setFilters(createEmptyFilters())}
              />
            )}
            <div className="deck-picker-grid" ref={pickerScrollRef}>
              {filteredCards.length === 0 ? (
                <div className="deck-empty-state">No cards match</div>
              ) : (
                <div style={{ height: pickerVirtualizer.getTotalSize(), position: 'relative' }}>
                  {pickerVirtualizer.getVirtualItems().map(vRow => (
                    <div
                      key={vRow.index}
                      style={{
                        position: 'absolute',
                        top: vRow.start,
                        left: padH,
                        right: padH,
                        display: 'grid',
                        gridTemplateColumns: colTemplate,
                        justifyContent: 'start',
                        gap: pickerGap,
                      }}
                    >
                      {pickerRows[vRow.index].map(card => (
                        <DeckPickerCard
                          key={card.id}
                          card={card}
                          cards={cards}
                          factions={factions}
                          rarities={rarities}
                          keywords={keywords}
                          quantity={deckQtyByCardId.get(card.id) ?? 0}
                          maxCopies={deckSettings.maxCopiesPerCard}
                          globalSettings={globalSettings}
                          onAdd={() => handleAdd(card.id)}
                          onLongPress={setTouchPreviewCard}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile long-press card preview overlay */}
      {touchPreviewCard && (
        <div className="deck-touch-preview-scrim" onClick={() => setTouchPreviewCard(null)}>
          <CardPreview card={touchPreviewCard} {...previewProps} />
          <span className="deck-touch-preview-hint">Tap to close</span>
        </div>
      )}
    </>
  );
}

