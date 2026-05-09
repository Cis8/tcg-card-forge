import React, { useState, useMemo } from 'react';
import { CardThumbnail } from './card-thumbnail';
import { CollectionFilterBar } from './collection-filter-bar';
import { Glyph } from './glyphs';
import type { Card, Faction, Keyword, Rarity } from './types';
import {
  type CollectionFilters,
  createEmptyFilters,
  hasActiveFilters,
  applyFilters,
} from './collection-filter';

interface CollectionProps {
  open: boolean;
  cards: Card[];
  currentId: string;
  factions: Faction[];
  rarities: Rarity[];
  keywords: Keyword[];
  onClose: () => void;
  onPick: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function Collection({
  open, cards, currentId, factions, rarities, keywords,
  onClose, onPick, onDelete, onNew,
}: CollectionProps): React.ReactElement | null {
  const [filters, setFilters] = useState<CollectionFilters>(createEmptyFilters);
  const [showFilters, setShowFilters] = useState(true);

  const filteredCards = useMemo(
    () => applyFilters(cards, filters, keywords),
    [cards, filters, keywords],
  );

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
            <div className="collection-grid-scroll">
              <div className="collection-grid">
                {filteredCards.map(c => (
                  <CollectionCard key={c.id} card={c}
                                  factions={factions} rarities={rarities}
                                  active={c.id === currentId}
                                  onPick={() => onPick(c.id)}
                                  onDelete={() => onDelete(c.id)}/>
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
  card: Card;
  factions: Faction[];
  rarities: Rarity[];
  active: boolean;
  onPick: () => void;
  onDelete: () => void;
}

function CollectionCard({ card, factions, rarities, active, onPick, onDelete }: CollectionCardProps): React.ReactElement {
  return (
    <div className={`coll-card ${active ? 'on' : ''}`} onClick={onPick}>
      <CardThumbnail card={card} factions={factions} rarities={rarities}/>
      <button type="button" className="coll-card-del"
              title="Delete"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}>
        <Glyph name="trash" size={12}/>
      </button>
    </div>
  );
}
