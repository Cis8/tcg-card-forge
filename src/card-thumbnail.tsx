// card-thumbnail.tsx — shared card thumbnail used in Collection and DeckEditor.
import React from 'react';
import { deriveFaction } from './color-utils';
import { Glyph } from './glyphs';
import type { CardWithArt, Faction, Rarity } from './types';

export interface CardThumbnailProps {
  card: CardWithArt;
  factions: Faction[];
  rarities: Rarity[];
}

export function CardThumbnail({ card, factions, rarities }: CardThumbnailProps): React.ReactElement {
  const factionRaw = factions.find(f => f.id === card.faction) ?? factions[0];
  const faction = deriveFaction(factionRaw);
  const rarity = card.rarity ? rarities.find(r => r.id === card.rarity) : undefined;
  const showCost = card.type !== 'environment' || card.cost != null;
  return (
    <>
      <div className="coll-card-art" style={{
        background: card.artHandle
          ? `linear-gradient(180deg, transparent 0%, ${faction.bg[0]}90 100%)`
          : `radial-gradient(ellipse at 50% 30%, ${faction.bg[2]}aa 0%, transparent 70%),
             linear-gradient(160deg, ${faction.bg[0]} 0%, ${faction.bg[1]} 100%)`,
      }}>
        {card.artHandle && <img src={card.artHandle.objectUrl} alt="" className="coll-card-art-img"/>}
        {!card.artHandle && (
          <div className="coll-card-watermark" style={{ color: faction.accent }}>
            <Glyph name={factionRaw.glyph} size={56}/>
          </div>
        )}
        {showCost && <div className="coll-card-cost">{card.cost ?? 0}</div>}
        {card.type === 'unit' && (
          <div className="coll-card-stats">
            <span>{card.attack ?? 0}</span>
            <span style={{ opacity: .35 }}>/</span>
            <span>{card.health ?? 0}</span>
          </div>
        )}
      </div>
      <div className="coll-card-meta" style={{ borderTop: rarity ? `2px solid ${rarity.color}` : '2px solid rgba(255,220,150,0.2)' }}>
        <div className="coll-card-name">{card.name || 'Untitled'}</div>
        <div className="coll-card-sub">
          <span style={{ color: faction.accent }}>{factionRaw.name}</span>
          {rarity && (
            <>
              <span> · </span>
              <span style={{ color: rarity.color }}>{rarity.name}</span>
            </>
          )}
          {!rarity && (
            <>
              <span> · </span>
              <span style={{ opacity: 0.45 }}>Token</span>
            </>
          )}
        </div>
      </div>
    </>
  );
}
