import React, { useState, useEffect, useRef } from 'react';
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
import { GlyphPicker } from './glyph-picker';
import { confirmDestructiveAction } from './confirm';
import { ReferencePicker, insertToken } from './reference-picker';
import type { Keyword, ThematicGlyphName, CardWithArt, Faction, Rarity, GlobalSettings } from './types';

const PRESET_COLORS = [
  '#c2410c', '#b45309', '#15803d', '#0e7490',
  '#1d4ed8', '#6b21a8', '#9d174d', '#475569',
];

interface KeywordManagerProps {
  open: boolean;
  keywords: Keyword[];
  cards: CardWithArt[];
  factions: Faction[];
  rarities: Rarity[];
  globalSettings: GlobalSettings;
  initialEditing?: string;
  onClose: () => void;
  onChange: (kws: Keyword[]) => void;
}

function SortableKeywordItem({ kw, onEdit }: { kw: Keyword; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: kw.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <li ref={setNodeRef} style={style} className="kw-list-item" onClick={onEdit}>
      <span {...attributes} {...listeners}
            onClick={(e) => e.stopPropagation()}
            style={{ cursor: 'grab', padding: '4px 6px', color: 'rgba(255,230,180,.3)', touchAction: 'none', userSelect: 'none', flexShrink: 0 }}
            aria-label="Drag to reorder">⋮⋮</span>
      <span className="kw-list-glyph" style={{ color: kw.color, background: `${kw.color}18` }}>
        <Glyph name={kw.glyph} size={16}/>
      </span>
      <span className="kw-list-text">
        <span className="kw-list-name" style={{ color: kw.color }}>{kw.name}</span>
        <span className="kw-list-desc">{kw.description}</span>
      </span>
    </li>
  );
}

export function KeywordManager({ open, keywords, cards, factions, rarities, globalSettings, initialEditing, onClose, onChange }: KeywordManagerProps): React.ReactElement | null {
  const [editing, setEditing] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  useEffect(() => {
    if (open) setEditing(initialEditing ?? null);
  }, [open, initialEditing]);
  if (!open) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = keywords.findIndex(k => k.id === active.id);
      const newIndex = keywords.findIndex(k => k.id === over.id);
      onChange(arrayMove(keywords, oldIndex, newIndex));
    }
  };

  const onSave = (kw: Keyword) => {
    if (kw.id === '_new') {
      const id = `k_${Date.now().toString(36)}`;
      onChange([...keywords, { ...kw, id }]);
    } else {
      onChange(keywords.map(k => k.id === kw.id ? kw : k));
    }
    setEditing(null);
  };
  const onDelete = (id: string) => {
    if (!confirmDestructiveAction('Delete this keyword? It will no longer style existing card text.')) return;
    onChange(keywords.filter(k => k.id !== id));
    setEditing(null);
  };

  const editingKw: Keyword | undefined = editing === 'new'
    ? { id: '_new', name: '', glyph: 'bolt', color: PRESET_COLORS[0], description: '' }
    : keywords.find(k => k.id === editing);

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal kw-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <span className="modal-eyebrow">Library</span>
            <h2 className="modal-title">Keywords</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <Glyph name="close" size={16}/>
          </button>
        </header>

        <div className="kw-modal-body">
          <div className="kw-list">
            <div className="kw-list-head">
              <span>{keywords.length} keywords</span>
              <button type="button" className="btn btn-primary btn-sm"
                      onClick={() => setEditing('new')}>
                <Glyph name="plus" size={12}/>
                <span>New keyword</span>
              </button>
            </div>
            <ul>
              {editing === null ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={keywords.map(k => k.id)} strategy={verticalListSortingStrategy}>
                    {keywords.map(k => (
                      <SortableKeywordItem key={k.id} kw={k} onEdit={() => setEditing(k.id)}/>
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                keywords.map(k => (
                  <li key={k.id}
                      className={`kw-list-item ${editing === k.id ? 'on' : ''}`}
                      onClick={() => setEditing(k.id)}>
                    <span className="kw-list-glyph" style={{ color: k.color, background: `${k.color}18` }}>
                      <Glyph name={k.glyph} size={16}/>
                    </span>
                    <span className="kw-list-text">
                      <span className="kw-list-name" style={{ color: k.color }}>{k.name}</span>
                      <span className="kw-list-desc">{k.description}</span>
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="kw-detail">
            {!editingKw ? (
              <div className="kw-empty">
                <Glyph name="book" size={32}/>
                <p>Select a keyword to edit, or create a new one.</p>
              </div>
            ) : (
              <KeywordEditor key={editingKw.id} keyword={editingKw}
                             keywords={keywords}
                             cards={cards}
                             factions={factions}
                             rarities={rarities}
                             globalSettings={globalSettings}
                             onSave={onSave}
                             onCancel={() => setEditing(null)}
                             onDelete={editingKw.id !== '_new' ? () => onDelete(editingKw.id) : undefined}/>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface KeywordEditorProps {
  keyword: Keyword;
  keywords: Keyword[];
  cards: CardWithArt[];
  factions: Faction[];
  rarities: Rarity[];
  globalSettings: GlobalSettings;
  onSave: (kw: Keyword) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

function KeywordEditor({ keyword, keywords, cards, factions, rarities, globalSettings, onSave, onCancel, onDelete }: KeywordEditorProps): React.ReactElement {
  const [draft, setDraft] = useState<Keyword>(keyword);
  const [showRefPicker, setShowRefPicker] = useState(false);
  const set = (patch: Partial<Keyword>) => setDraft(d => ({ ...d, ...patch }));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPosRef = useRef<number>(0);

  const handleRefInsert = (token: string) => {
    const newDesc = insertToken(draft.description ?? '', cursorPosRef.current, token);
    set({ description: newDesc });
    setShowRefPicker(false);
  };

  return (
    <div className="kw-editor">
      {showRefPicker && (
        <ReferencePicker
          keywords={keywords}
          cards={cards}
          factions={factions}
          rarities={rarities}
          globalSettings={globalSettings}
          onInsert={handleRefInsert}
          onClose={() => setShowRefPicker(false)}
        />
      )}
      <div className="kw-preview">
        <span className="kw" style={{ color: draft.color, fontSize: 14 }}>
          <span className="kw-glyph" style={{ color: draft.color }}>
            <Glyph name={draft.glyph} size={13}/>
          </span>
          <span className="kw-name">{draft.name || 'Keyword'}</span>
        </span>
        <span className="kw-preview-hint">Preview</span>
      </div>

      <label className="field">
        <span className="field-label">Name</span>
        <input className="text-input" type="text" value={draft.name}
               placeholder="e.g. Last Breath"
               onChange={(e) => set({ name: e.target.value })}/>
      </label>

      <label className="field">
        <span className="field-label">Description</span>
        <textarea className="text-input text-area" rows={2}
                  ref={textareaRef}
                  value={draft.description}
                  placeholder="What does this keyword do?"
                  onChange={(e) => set({ description: e.target.value })}
                  onBlur={() => { cursorPosRef.current = textareaRef.current?.selectionStart ?? cursorPosRef.current; }}/>
        <button
          type="button"
          className="btn btn-sm btn-ghost ref-insert-btn"
          onClick={() => {
            cursorPosRef.current = textareaRef.current?.selectionStart ?? (draft.description ?? '').length;
            setShowRefPicker(true);
          }}
        >
          <Glyph name="edit" size={12}/>
          <span>@ Reference</span>
        </button>
      </label>

      <div className="field">
        <span className="field-label">Color</span>
        <div className="color-row">
          {PRESET_COLORS.map(c => (
            <button type="button" key={c}
                    className={`color-pick ${draft.color === c ? 'on' : ''}`}
                    onClick={() => set({ color: c })}
                    style={{ background: c }}/>
          ))}
          <input type="color" className="color-custom" value={draft.color}
                 onChange={(e) => set({ color: e.target.value })}/>
        </div>
      </div>

      <div className="field">
        <span className="field-label">Glyph</span>
        <GlyphPicker
          value={draft.glyph}
          accentColor={draft.color}
          onChange={(g: ThematicGlyphName) => set({ glyph: g })}
        />
      </div>

      <div className="kw-editor-actions">
        {onDelete && (
          <button type="button" className="btn btn-danger" onClick={onDelete}>
            <Glyph name="trash" size={12}/>
            <span>Delete</span>
          </button>
        )}
        <span style={{ flex: 1 }}/>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-primary"
                disabled={!draft.name.trim()}
                onClick={() => onSave({ ...draft, name: draft.name.trim() })}>
          {keyword.id === '_new' ? 'Create' : 'Save'}
        </button>
      </div>
    </div>
  );
}
