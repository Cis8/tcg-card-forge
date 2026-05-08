import React, { useState } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Glyph } from './glyphs';
import type { Card, Deck, DeckSettings, Faction } from './types';
import { createDeck, getDeckTotal, getDeckFactions, validateDeck } from './deck-utils';

interface DeckManagerProps {
  open: boolean;
  decks: Deck[];
  cards: Card[];
  factions: Faction[];
  deckSettings: DeckSettings;
  onClose: () => void;
  onChange: (decks: Deck[]) => void;
  onOpenDeck: (deckId: string) => void;
}

function SortableDeckItem({ deck, cards, factions, deckSettings, onOpen, onDelete }: {
  deck: Deck; cards: Card[]; factions: Faction[]; deckSettings: DeckSettings;
  onOpen: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deck.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1,
  };
  const total = getDeckTotal(deck);
  const deckFactions = getDeckFactions(deck, cards, factions);
  const issues = validateDeck(deck, cards, deckSettings);
  const isValid = issues.length === 0 && total > 0;

  return (
    <li ref={setNodeRef} style={style} className="kw-list-item deck-manager-item" onClick={onOpen}>
      <span {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}
            style={{ cursor: 'grab', padding: '4px 6px', color: 'rgba(255,230,180,.3)', touchAction: 'none', userSelect: 'none', flexShrink: 0 }}
            aria-label="Drag to reorder">⋮⋮</span>
      <span className="kw-list-text">
        <span className="kw-list-name">{deck.name || 'Untitled Deck'}</span>
        <span className="kw-list-desc">
          {deckFactions.slice(0, 3).map(f => (
            <Glyph key={f.id} name={f.glyph} size={12} color={f.primary} style={{ marginRight: 2 }}/>
          ))}
          <span style={{ marginLeft: deckFactions.length > 0 ? 4 : 0 }}>{total} cards</span>
        </span>
      </span>
      <span className={`deck-size-badge${isValid ? ' valid' : total === 0 ? '' : ' invalid'}`}>
        {total}/{deckSettings.maxDeckSize}
      </span>
      <button type="button" className="coll-card-del deck-del-btn" title="Delete deck"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}>
        <Glyph name="trash" size={12}/>
      </button>
    </li>
  );
}

export function DeckManager({ open, decks, cards, factions, deckSettings, onClose, onChange, onOpenDeck }: DeckManagerProps): React.ReactElement | null {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!open) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = decks.findIndex(d => d.id === active.id);
      const newIndex = decks.findIndex(d => d.id === over.id);
      onChange(arrayMove(decks, oldIndex, newIndex));
    }
  };

  const handleDelete = (id: string) => {
    const deck = decks.find(d => d.id === id);
    if (!confirm(`Delete deck "${deck?.name || 'this deck'}"? This cannot be undone.`)) return;
    onChange(decks.filter(d => d.id !== id));
  };

  const handleCreate = () => {
    const name = newName.trim() || 'New Deck';
    const newDeck = createDeck(name);
    newDeck.description = newDesc.trim();
    onChange([...decks, newDeck]);
    setCreating(false);
    setNewName('');
    setNewDesc('');
    onClose();
    onOpenDeck(newDeck.id);
  };

  const handleCancelCreate = () => {
    setCreating(false);
    setNewName('');
    setNewDesc('');
  };

  const handleNewDeck = () => {
    setCreating(true);
  };

  const handleOpen = (id: string) => {
    onClose();
    onOpenDeck(id);
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal kw-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <span className="modal-eyebrow">Library</span>
            <h2 className="modal-title">Decks</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <Glyph name="close" size={16}/>
          </button>
        </header>

        <div className="kw-modal-body">
          <div className="kw-list">
            <div className="kw-list-head">
              <span>{decks.length} {decks.length === 1 ? 'deck' : 'decks'}</span>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleNewDeck}>
                <Glyph name="plus" size={12}/><span>New Deck</span>
              </button>
            </div>
            <ul>
              {decks.length === 0 ? (
                <li className="kw-empty" style={{ padding: '24px 0' }}>
                  <Glyph name="deck" size={28}/>
                  <p>No decks yet. Create one to get started.</p>
                </li>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={decks.map(d => d.id)} strategy={verticalListSortingStrategy}>
                    {decks.map(deck => (
                      <SortableDeckItem
                        key={deck.id}
                        deck={deck}
                        cards={cards}
                        factions={factions}
                        deckSettings={deckSettings}
                        onOpen={() => handleOpen(deck.id)}
                        onDelete={() => handleDelete(deck.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </ul>
          </div>

          <div className="kw-detail">
            {creating ? (
              <div className="kw-editor">
                <h3 style={{ margin: '0 0 16px', color: 'var(--gold)', fontSize: '1rem', fontWeight: 600 }}>
                  New Deck
                </h3>
                <label className="field">
                  <span className="field-label">Name</span>
                  <input
                    className="text-input"
                    type="text"
                    value={newName}
                    placeholder="e.g. Aggro Rush"
                    autoFocus
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') handleCancelCreate(); }}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Description</span>
                  <textarea
                    className="text-input"
                    value={newDesc}
                    placeholder="Optional notes about this deck…"
                    rows={3}
                    style={{ resize: 'vertical' }}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </label>
                <div className="kw-editor-actions">
                  <span style={{ flex: 1 }}/>
                  <button type="button" className="btn btn-ghost" onClick={handleCancelCreate}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={handleCreate}>
                    Create
                  </button>
                </div>
              </div>
            ) : (
              <div className="kw-empty">
                <Glyph name="deck" size={32}/>
                <p>Select a deck to open it, or create a new one.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
