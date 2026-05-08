import React from 'react';
import { deriveTheme } from './color-utils';
import { Glyph } from './glyphs';
import type { Card, Theme, Rarity } from './types';

interface CollectionProps {
  open: boolean;
  cards: Card[];
  currentId: string;
  themes: Theme[];
  rarities: Rarity[];
  onClose: () => void;
  onPick: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function Collection({ open, cards, currentId, themes, rarities, onClose, onPick, onDelete, onNew }: CollectionProps): React.ReactElement | null {
  if (!open) return null;
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal collection-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <span className="modal-eyebrow">Library</span>
            <h2 className="modal-title">Collection</h2>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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
                              themes={themes} rarities={rarities}
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
  themes: Theme[];
  rarities: Rarity[];
  active: boolean;
  onPick: () => void;
  onDelete: () => void;
}

function CollectionCard({ card, themes, rarities, active, onPick, onDelete }: CollectionCardProps): React.ReactElement {
  const themeRaw = themes.find(t => t.id === card.theme) ?? themes[0];
  const theme = deriveTheme(themeRaw);
  const rarity = rarities.find(r => r.id === card.rarity) ?? rarities[0];
  return (
    <div className={`coll-card ${active ? 'on' : ''}`} onClick={onPick}>
      <div className="coll-card-art" style={{
        background: card.art
          ? `linear-gradient(180deg, transparent 0%, ${theme.bg[0]}90 100%)`
          : `radial-gradient(ellipse at 50% 30%, ${theme.bg[2]}aa 0%, transparent 70%),
             linear-gradient(160deg, ${theme.bg[0]} 0%, ${theme.bg[1]} 100%)`,
      }}>
        {card.art && (
          <img src={card.art} alt="" className="coll-card-art-img"/>
        )}
        {!card.art && (
          <div className="coll-card-watermark" style={{ color: theme.accent }}>
            <Glyph name={themeRaw.glyph} size={56}/>
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
          <span style={{ color: theme.accent }}>{themeRaw.name}</span>
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
