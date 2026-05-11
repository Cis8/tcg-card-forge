import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CardThumbnail } from './card-thumbnail';
import { CollectionFilterBar } from './collection-filter-bar';
import { Glyph } from './glyphs';
import type { CardWithArt, Faction, Keyword, Rarity } from './types';
import {
  type CollectionFilters,
  createEmptyFilters,
  hasActiveFilters,
  applyFilters,
} from './collection-filter';
import { sortCardsByCost } from './deck-utils';

// Grid metrics — must match card.css / mobile.css
const DESKTOP_BP = 768;
function gridMetrics(containerW: number) {
  const mobile = containerW < DESKTOP_BP;
  return {
    colMinW: mobile ? 130 : 180,
    gap:     mobile ? 10  : 14,
    padding: mobile ? 12  : 18,
    itemH:   162, // art(110) + meta(~52) — same on both breakpoints
  };
}

function useCollectionGrid(scrollRef: React.RefObject<HTMLDivElement | null>) {
  const [containerW, setContainerW] = useState(600);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setContainerW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [scrollRef]);
  const { colMinW, gap, padding, itemH } = gridMetrics(containerW);
  const cols = Math.max(1, Math.floor((containerW - padding * 2 + gap) / (colMinW + gap)));
  return { cols, gap, padding, itemH };
}

interface CollectionProps {
  open: boolean;
  cards: CardWithArt[];
  currentId: string;
  factions: Faction[];
  rarities: Rarity[];
  keywords: Keyword[];
  onClose: () => void;
  onPick: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onExportCard: (card: CardWithArt) => void;
  onExportAllPng: () => void;
}

export function Collection({
  open, cards, currentId, factions, rarities, keywords,
  onClose, onPick, onDelete, onNew, onExportCard, onExportAllPng,
}: CollectionProps): React.ReactElement | null {
  const [filters, setFilters] = useState<CollectionFilters>(createEmptyFilters);
  const [showFilters, setShowFilters] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { cols, gap, padding, itemH } = useCollectionGrid(scrollRef);

  const filteredCards = useMemo(
    () => sortCardsByCost(applyFilters(cards, filters) as CardWithArt[]),
    [cards, filters],
  );

  const rows = useMemo(() => {
    const result: CardWithArt[][] = [];
    for (let i = 0; i < filteredCards.length; i += cols) result.push(filteredCards.slice(i, i + cols));
    return result;
  }, [filteredCards, cols]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => itemH + gap,
    overscan: 3,
    paddingStart: padding,
    paddingEnd: padding,
  });

  if (!open) return null;

  const clearFilters = () => setFilters(createEmptyFilters());
  const active = hasActiveFilters(filters);

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal collection-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <span className="modal-eyebrow">Library</span>
            <h2 className="modal-title">Collection</h2>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {cards.length > 0 && (
              <button
                type="button"
                className="deck-filter-toggle-btn"
                onClick={() => setShowFilters(v => !v)}
              >
                {showFilters ? '▲' : '▼'} Filters
              </button>
            )}
            {cards.length > 0 && (
              <button
                type="button"
                className="btn btn-sm"
                title="Export all cards as PNG images in a ZIP file"
                onClick={onExportAllPng}
              >
                <Glyph name="download" size={12}/>
                <span>Export PNGs</span>
              </button>
            )}
            <button type="button" className="btn btn-primary btn-sm" onClick={onNew}>
              <Glyph name="plus" size={12}/>
              <span>New card</span>
            </button>
            <button type="button" className="icon-btn" onClick={onClose}>
              <Glyph name="close" size={16}/>
            </button>
          </div>
        </header>

        {cards.length > 0 && showFilters && (
          <CollectionFilterBar
            filters={filters}
            factions={factions}
            keywords={keywords}
            rarities={rarities}
            onChange={setFilters}
            onClear={clearFilters}
          />
        )}

        {cards.length === 0 ? (
          <div className="collection-empty">
            <Glyph name="collection" size={32}/>
            <p>No saved cards yet — tweak the card and hit <b>Save</b>.</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="collection-empty">
            <Glyph name="collection" size={32}/>
            <p>No cards match the current filters.</p>
            {active && (
              <button type="button" className="btn btn-sm" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="coll-results-info">
              {active
                ? `${filteredCards.length} of ${cards.length} cards`
                : `${cards.length} card${cards.length !== 1 ? 's' : ''}`}
            </div>
            <div className="collection-grid-scroll" ref={scrollRef}>
              <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
                {virtualizer.getVirtualItems().map(vRow => (
                  <div
                    key={vRow.index}
                    style={{
                      position: 'absolute',
                      top: vRow.start,
                      left: padding,
                      right: padding,
                      display: 'grid',
                      gridTemplateColumns: `repeat(${cols}, 1fr)`,
                      gap,
                    }}
                  >
                    {rows[vRow.index].map(c => (
                      <CollectionCard key={c.id} card={c}
                                      factions={factions} rarities={rarities}
                                      active={c.id === currentId}
                                      onPick={() => onPick(c.id)}
                                      onDelete={() => onDelete(c.id)}
                                      onExport={() => onExportCard(c)}/>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Collection card thumbnail ───────────────────────────────────────────────

interface CollectionCardProps {
  card: CardWithArt;
  factions: Faction[];
  rarities: Rarity[];
  active: boolean;
  onPick: () => void;
  onDelete: () => void;
  onExport: () => void;
}

function CollectionCard({ card, factions, rarities, active, onPick, onDelete, onExport }: CollectionCardProps): React.ReactElement {
  return (
    <div className={`coll-card ${active ? 'on' : ''}`} onClick={onPick}>
      <CardThumbnail card={card} factions={factions} rarities={rarities}/>
      <button type="button" className="coll-card-export"
              title="Export card as JSON"
              onClick={(e) => { e.stopPropagation(); onExport(); }}>
        <Glyph name="download" size={12}/>
      </button>
      <button type="button" className="coll-card-del"
              title="Delete"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}>
        <Glyph name="trash" size={12}/>
      </button>
    </div>
  );
}
