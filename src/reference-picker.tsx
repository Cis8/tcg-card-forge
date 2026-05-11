import React, { useState, useMemo, useEffect } from 'react';
import { CardHoverPreview } from './card-preview';
import { CardThumbnail } from './card-thumbnail';
import { Glyph } from './glyphs';
import { applyFilters, createEmptyFilters } from './collection-filter';
import type { CardWithArt, Keyword, Faction, Rarity, GlobalSettings, GlyphName } from './types';

/** Insert a reference token at the given cursor position, auto-spacing around it. */
export function insertToken(text: string, pos: number, token: string): string {
  const before = text.slice(0, pos);
  const after = text.slice(pos);
  const needsLeadingSpace = before.length > 0 && !/[\s\n]$/.test(before);
  const needsTrailingSpace = after.length > 0 && !/^[\s\n]/.test(after);
  return before + (needsLeadingSpace ? ' ' : '') + token + (needsTrailingSpace ? ' ' : '') + after;
}

export interface ReferencePickerProps {
  keywords: Keyword[];
  cards: CardWithArt[];
  factions: Faction[];
  rarities: Rarity[];
  globalSettings: GlobalSettings;
  onInsert: (token: string) => void;
  onClose: () => void;
  onManageKeywords?: () => void;
}

type Tab = 'kw' | 'card';

export function ReferencePicker({
  keywords, cards, factions, rarities, globalSettings,
  onInsert, onClose, onManageKeywords,
}: ReferencePickerProps): React.ReactElement {
  const [tab, setTab] = useState<Tab>('kw');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const filteredCards = useMemo(
    () => applyFilters(cards, { ...createEmptyFilters(), search }) as CardWithArt[],
    [cards, search],
  );

  const { font, costShape, attackShape, healthShape, costColor, attackColor, healthColor } = globalSettings;
  const previewProps = { factions, rarities, keywords, cards, font, costShape, attackShape, healthShape, costColor, attackColor, healthColor };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal ref-picker-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <span className="modal-eyebrow">Description</span>
            <h2 className="modal-title">Insert Reference</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <Glyph name="close" size={16}/>
          </button>
        </header>

        <div className="ref-picker-tabs">
          <button type="button" className={`ref-picker-tab${tab === 'kw' ? ' on' : ''}`} onClick={() => setTab('kw')}>
            Keywords
          </button>
          <button type="button" className={`ref-picker-tab${tab === 'card' ? ' on' : ''}`} onClick={() => setTab('card')}>
            Cards
          </button>
        </div>

        <div className="ref-picker-body">
          {tab === 'kw' && (
            <>
              <div className="ref-picker-kw-chips">
                {keywords.length === 0 && (
                  <span style={{ fontSize: 12, opacity: 0.45 }}>No keywords defined yet.</span>
                )}
                {keywords.map(k => (
                  <button
                    type="button"
                    key={k.id}
                    className="kw-bar-chip"
                    style={{ color: k.color }}
                    title={k.description}
                    onClick={() => { onInsert(`[kw:${k.id}]`); onClose(); }}
                  >
                    <Glyph name={k.glyph as GlyphName} size={12}/>
                    <span>{k.name}</span>
                  </button>
                ))}
              </div>
              {onManageKeywords && (
                <button type="button" className="kw-bar-manage" style={{ alignSelf: 'flex-start' }} onClick={() => { onManageKeywords(); onClose(); }}>
                  <Glyph name="edit" size={12}/><span>Manage keywords…</span>
                </button>
              )}
            </>
          )}

          {tab === 'card' && (
            <>
              <input
                className="ref-picker-search"
                type="search"
                placeholder="Search cards…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              {filteredCards.length === 0 && (
                <span style={{ fontSize: 12, opacity: 0.45 }}>No cards match your search.</span>
              )}
              <div className="ref-picker-card-grid">
                {filteredCards.map(c => (
                  <CardHoverPreview key={c.id} card={c} {...previewProps}>
                    <button
                      type="button"
                      className="ref-picker-card-item"
                      onClick={() => { onInsert(`[card:${c.id}]`); onClose(); }}
                    >
                      <CardThumbnail card={c} factions={factions} rarities={rarities}/>
                    </button>
                  </CardHoverPreview>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
