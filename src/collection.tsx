import React, { useRef, useState, useMemo } from 'react';
import { deriveFaction } from './color-utils';
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
  onExportJson?: () => void;
  onImportJson?: (file: File) => void;
}

export function Collection({
  open, cards, currentId, factions, rarities, keywords,
  onClose, onPick, onDelete, onNew, onExportJson, onImportJson,
}: CollectionProps): React.ReactElement | null {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState<CollectionFilters>(createEmptyFilters);

  const filteredCards = useMemo(
    () => applyFilters(cards, filters, keywords),
    [cards, filters, keywords],
  );

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportJson) onImportJson(file);
    e.target.value = '';
  };

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
            {onExportJson && (
              <button type="button" className="btn btn-sm" onClick={onExportJson}>
                <Glyph name="download" size={12}/>
                <span>Export JSON</span>
              </button>
            )}
            {onImportJson && (
              <>
                <button type="button" className="btn btn-sm" onClick={() => fileInputRef.current?.click()}>
                  <Glyph name="upload" size={12}/>
                  <span>Import JSON</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </>
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

        {cards.length > 0 && (
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
            <div className="collection-grid">
              {filteredCards.map(c => (
                <CollectionCard key={c.id} card={c}
                                factions={factions} rarities={rarities}
                                active={c.id === currentId}
                                onPick={() => onPick(c.id)}
                                onDelete={() => onDelete(c.id)}/>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Filter bar ─────────────────────────────────────────────────────────────

interface CollectionFilterBarProps {
  filters:  CollectionFilters;
  factions: Faction[];
  keywords: Keyword[];
  onChange: (f: CollectionFilters) => void;
  onClear:  () => void;
}

function CollectionFilterBar({
  filters, factions, keywords, onChange, onClear,
}: CollectionFilterBarProps): React.ReactElement {
  const active = hasActiveFilters(filters);

  const toggleFaction = (id: string) =>
    onChange({
      ...filters,
      factions: filters.factions.includes(id)
        ? filters.factions.filter(f => f !== id)
        : [...filters.factions, id],
    });

  const toggleKeyword = (id: string) =>
    onChange({
      ...filters,
      keywords: filters.keywords.includes(id)
        ? filters.keywords.filter(k => k !== id)
        : [...filters.keywords, id],
    });

  const setCost = (raw: string) => {
    if (raw === '') { onChange({ ...filters, cost: null }); return; }
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n)) return;
    onChange({ ...filters, cost: Math.max(0, Math.min(99, n)) });
  };

  return (
    <div className="coll-filter">
      {/* Row 1: search + cost + clear */}
      <div className="coll-filter-row">
        <input
          className="coll-filter-search"
          type="search"
          placeholder="Search name, type, description…"
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
        />
        <div className="coll-filter-cost">
          <span className="coll-filter-label" style={{ width: 'auto' }}>Cost</span>
          <input
            className="coll-filter-cost-input"
            type="number"
            min={0}
            max={99}
            placeholder="—"
            value={filters.cost ?? ''}
            onChange={e => setCost(e.target.value)}
          />
          {filters.cost !== null && (
            <button
              type="button"
              className="coll-filter-cost-clear"
              title="Clear cost filter"
              onClick={() => onChange({ ...filters, cost: null })}
            >×</button>
          )}
        </div>
        {active && (
          <button type="button" className="coll-filter-clear" onClick={onClear}>
            Clear all
          </button>
        )}
      </div>

      {/* Row 2: factions */}
      {factions.length > 0 && (
        <div className="coll-filter-row">
          <span className="coll-filter-label">Faction</span>
          <div className="coll-filter-chips">
            {factions.map(f => {
              const on = filters.factions.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`coll-filter-chip${on ? ' on' : ''}`}
                  style={on ? { borderColor: f.primary, color: f.primary } : undefined}
                  onClick={() => toggleFaction(f.id)}
                >
                  <Glyph name={f.glyph} size={11}/>
                  {f.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Row 3: keywords */}
      {keywords.length > 0 && (
        <div className="coll-filter-row">
          <span className="coll-filter-label">Keywords</span>
          <div className="coll-filter-chips">
            {keywords.map(k => {
              const on = filters.keywords.includes(k.id);
              return (
                <button
                  key={k.id}
                  type="button"
                  className={`coll-filter-chip${on ? ' on' : ''}`}
                  style={on ? { borderColor: k.color, color: k.color } : undefined}
                  onClick={() => toggleKeyword(k.id)}
                >
                  <Glyph name={k.glyph} size={11}/>
                  {k.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
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
  const factionRaw = factions.find(f => f.id === card.faction) ?? factions[0];
  const faction = deriveFaction(factionRaw);
  const rarity = rarities.find(r => r.id === card.rarity) ?? rarities[0];
  return (
    <div className={`coll-card ${active ? 'on' : ''}`} onClick={onPick}>
      <div className="coll-card-art" style={{
        background: card.art
          ? `linear-gradient(180deg, transparent 0%, ${faction.bg[0]}90 100%)`
          : `radial-gradient(ellipse at 50% 30%, ${faction.bg[2]}aa 0%, transparent 70%),
             linear-gradient(160deg, ${faction.bg[0]} 0%, ${faction.bg[1]} 100%)`,
      }}>
        {card.art && (
          <img src={card.art} alt="" className="coll-card-art-img"/>
        )}
        {!card.art && (
          <div className="coll-card-watermark" style={{ color: faction.accent }}>
            <Glyph name={factionRaw.glyph} size={56}/>
          </div>
        )}
        <div className="coll-card-cost">{card.cost ?? 0}</div>
        {card.type === 'unit' && (
          <div className="coll-card-stats">
            <span>{card.attack ?? 0}</span>
            <span style={{ opacity: .35 }}>/</span>
            <span>{card.health ?? 0}</span>
          </div>
        )}
      </div>
      <div className="coll-card-meta" style={{ borderTop: `2px solid ${rarity.color}` }}>
        <div className="coll-card-name">{card.name || 'Untitled'}</div>
        <div className="coll-card-sub">
          <span style={{ color: faction.accent }}>{factionRaw.name}</span>
          <span> · </span>
          <span style={{ color: rarity.color }}>{rarity.name}</span>
        </div>
      </div>
      <button type="button" className="coll-card-del"
              title="Delete"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}>
        <Glyph name="trash" size={12}/>
      </button>
    </div>
  );
}
