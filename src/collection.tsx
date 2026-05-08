import React, { useRef } from 'react';
import { deriveFaction } from './color-utils';
import { Glyph } from './glyphs';
import type { Card, Faction, Rarity } from './types';

interface CollectionProps {
  open: boolean;
  cards: Card[];
  currentId: string;
  factions: Faction[];
  rarities: Rarity[];
  onClose: () => void;
  onPick: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onExportJson?: () => void;
  onImportJson?: (file: File) => void;
}

export function Collection({ open, cards, currentId, factions, rarities, onClose, onPick, onDelete, onNew, onExportJson, onImportJson }: CollectionProps): React.ReactElement | null {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportJson) onImportJson(file);
    // Reset so the same file can be re-selected if needed
    e.target.value = '';
  };

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

        {cards.length === 0 ? (
          <div className="collection-empty">
            <Glyph name="collection" size={32}/>
            <p>No saved cards yet — tweak the card and hit <b>Save</b>.</p>
          </div>
        ) : (
          <div className="collection-grid">
            {cards.map(c => (
              <CollectionCard key={c.id} card={c}
                              factions={factions} rarities={rarities}
                              active={c.id === currentId}
                              onPick={() => onPick(c.id)}
                              onDelete={() => onDelete(c.id)}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
