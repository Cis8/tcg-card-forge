import React, { useState, useMemo } from 'react';
import { CardHoverPreview } from './card-preview';
import { Glyph } from './glyphs';
import type { Card, Deck, DeckSettings, Faction, GlobalSettings, Keyword, Rarity } from './types';
import {
  addCardToDeck, removeCardFromDeck,
  getDeckTotal, getDeckFactions, getDeckCostCurve, validateDeck,
} from './deck-utils';
import { applyFilters, createEmptyFilters } from './collection-filter';

export interface DeckEditorProps {
  deck: Deck;
  cards: Card[];
  factions: Faction[];
  rarities: Rarity[];
  keywords: Keyword[];
  globalSettings: GlobalSettings;
  onChange: (deck: Deck) => void;
  onBack: () => void;
}

interface DeckCardRowProps {
  card: Card;
  factions: Faction[];
  rarities: Rarity[];
  keywords: Keyword[];
  quantity: number;
  maxCopies: number;
  globalSettings: GlobalSettings;
  onAdd: () => void;
  onRemove: () => void;
}

function DeckCardRow({ card, factions, rarities, keywords, quantity, maxCopies, globalSettings, onAdd, onRemove }: DeckCardRowProps): React.ReactElement {
  const faction = factions.find(f => f.id === card.faction) ?? factions[0];
  const { font, costShape, attackShape, healthShape, costColor, attackColor, healthColor } = globalSettings;
  return (
    <CardHoverPreview
      card={card} factions={factions} rarities={rarities} keywords={keywords}
      font={font} costShape={costShape} attackShape={attackShape} healthShape={healthShape}
      costColor={costColor} attackColor={attackColor} healthColor={healthColor}
    >
      <div className="deck-card-row">
        <span className="deck-card-row-glyph" style={{ color: faction.primary }}>
          <Glyph name={faction.glyph} size={13} />
        </span>
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

export function DeckEditor({ deck, cards, factions, rarities, keywords, globalSettings, onChange, onBack }: DeckEditorProps): React.ReactElement {
  const deckSettings: DeckSettings = globalSettings.deckSettings;
  const [search, setSearch] = useState('');
  const [mobileTab, setMobileTab] = useState<'cards' | 'stats'>('cards');

  const filters = useMemo(() => ({ ...createEmptyFilters(), search }), [search]);
  const filteredCards = useMemo(() => applyFilters(cards, filters, keywords), [cards, filters, keywords]);

  const total = getDeckTotal(deck);
  const deckFactions = getDeckFactions(deck, cards, factions);
  const issues = validateDeck(deck, cards, deckSettings);
  const costCurve = getDeckCostCurve(deck, cards);
  const maxCost = Math.max(0, ...costCurve.values());

  const handleAdd = (cardId: string) => onChange(addCardToDeck(deck, cardId, deckSettings));
  const handleRemove = (cardId: string) => onChange(removeCardFromDeck(deck, cardId));
  const handleNameChange = (name: string) => onChange({ ...deck, name });
  const handleDescChange = (description: string) => onChange({ ...deck, description });

  return (
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
          >Stats</button>
        </div>
      </div>

      {/* ── Left panel: deck card list + card picker ── */}
      <aside className="deck-editor-left">
        <div className="deck-editor-left-header">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
            ← Back
          </button>
          <span className="deck-editor-title-sm">{deck.name || 'Untitled Deck'}</span>
        </div>

        <div className="deck-editor-section-label">Deck cards</div>
        <div className="deck-card-list">
          {deck.entries.length === 0 && (
            <div className="deck-empty-state">
              <Glyph name="deck" size={28} />
              <span>No cards yet</span>
            </div>
          )}
          {deck.entries.map(entry => {
            const card = cards.find(c => c.id === entry.cardId);
            if (!card) return null;
            return (
              <DeckCardRow
                key={entry.cardId}
                card={card}
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

        <div className="deck-editor-section-label" style={{ marginTop: 12 }}>Add cards</div>
        <input
          className="deck-search-input"
          type="search"
          placeholder="Search collection…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="deck-picker-list">
          {filteredCards.map(card => {
            const entry = deck.entries.find(e => e.cardId === card.id);
            const qty = entry?.quantity ?? 0;
            const atMax = qty >= deckSettings.maxCopiesPerCard;
            return (
              <div key={card.id} className={`deck-picker-item${atMax ? ' at-max' : ''}`}>
                <div className="deck-picker-card" onClick={() => !atMax && handleAdd(card.id)}>
                  <span className="deck-picker-cost">{card.cost}</span>
                  <span className="deck-picker-name">{card.name || 'Untitled'}</span>
                  {qty > 0 && <span className="deck-picker-qty">×{qty}</span>}
                </div>
              </div>
            );
          })}
          {filteredCards.length === 0 && (
            <div className="deck-empty-state">No cards match</div>
          )}
        </div>
      </aside>

      {/* ── Right panel: deck info + stats ── */}
      <main className="deck-editor-right">
        <div className="deck-editor-header-card">
          <div className="deck-editor-name-row">
            <input
              className="deck-name-input"
              type="text"
              value={deck.name}
              placeholder="Deck name…"
              onChange={e => handleNameChange(e.target.value)}
            />
            <div className="deck-total-badge">
              <span className={total >= deckSettings.minDeckSize ? 'valid' : 'pending'}>
                {total}
              </span>
              <span className="deck-total-sep">/</span>
              <span className="deck-total-max">{deckSettings.maxDeckSize}</span>
              <span className="deck-total-label">cards</span>
            </div>
          </div>
          <textarea
            className="deck-desc-input"
            rows={2}
            placeholder="Deck description…"
            value={deck.description}
            onChange={e => handleDescChange(e.target.value)}
          />
          <div className="deck-factions-row">
            {deckFactions.map(f => (
              <span key={f.id} className="deck-faction-badge" style={{ borderColor: f.primary, color: f.primary }}>
                <Glyph name={f.glyph} size={12} />
                {f.name}
              </span>
            ))}
            {deckFactions.length === 0 && (
              <span className="deck-faction-badge-empty">No factions</span>
            )}
          </div>
        </div>

        {issues.length > 0 && (
          <div className="deck-issues">
            {issues.map((issue, i) => (
              <div key={i} className={`deck-issue deck-issue--${issue.kind}`}>
                {issue.message}
              </div>
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
                    <div
                      className="deck-curve-bar"
                      style={{ height: `${Math.max(pct, 4)}%`, minHeight: count > 0 ? 4 : 0 }}
                    />
                    <div className="deck-curve-label">{cost === 10 ? '10+' : cost}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
