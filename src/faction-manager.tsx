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
import { deriveFaction } from './color-utils';
import { Glyph } from './glyphs';
import { GlyphPicker } from './glyph-picker';
import type { Faction, ThematicGlyphName } from './types';

const FACTION_PRESET_COLORS = [
  '#c84a18', '#d97706', '#e1a526',
  '#4f8a3a', '#0e7490', '#3d8ec9',
  '#7a3da8', '#9d174d', '#475569',
];

interface FactionManagerProps {
  open: boolean;
  factions: Faction[];
  onClose: () => void;
  onChange: (factions: Faction[]) => void;
  onCardFactionMissing?: (oldId: string, newId: string) => void;
}

function SortableFactionItem({ rawF, onEdit }: { rawF: Faction; onEdit: () => void }) {
  const f = deriveFaction(rawF);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: rawF.id });
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
      <span className="theme-list-swatch"
            style={{ background: `linear-gradient(160deg, ${f.bg[1]}, ${f.bg[2]})` }}>
        <Glyph name={rawF.glyph} size={18}/>
      </span>
      <span className="kw-list-text">
        <span className="kw-list-name" style={{ color: f.accent }}>{f.name}</span>
        <span className="kw-list-desc" style={{ fontFamily: 'ui-monospace, monospace' }}>
          {rawF.primary}
        </span>
      </span>
    </li>
  );
}

export function FactionManager({ open, factions, onClose, onChange, onCardFactionMissing }: FactionManagerProps): React.ReactElement | null {
  const [editing, setEditing] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  if (!open) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = factions.findIndex(f => f.id === active.id);
      const newIndex = factions.findIndex(f => f.id === over.id);
      onChange(arrayMove(factions, oldIndex, newIndex));
    }
  };

  const onSave = (f: Faction) => {
    if (f.id === '_new') {
      const id = `f_${Date.now().toString(36)}`;
      onChange([...factions, { ...f, id }]);
    } else {
      onChange(factions.map(x => x.id === f.id ? f : x));
    }
    setEditing(null);
  };

  const onDelete = (id: string) => {
    if (factions.length <= 1) { alert('Keep at least one faction.'); return; }
    if (!confirm('Delete this faction? Cards using it will fall back to the first remaining faction.')) return;
    const remaining = factions.filter(f => f.id !== id);
    onChange(remaining);
    if (onCardFactionMissing) onCardFactionMissing(id, remaining[0].id);
    setEditing(null);
  };

  const editingF: Faction | undefined = editing === 'new'
    ? { id: '_new', name: '', glyph: 'flame', primary: FACTION_PRESET_COLORS[0] }
    : factions.find(f => f.id === editing);

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal kw-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <span className="modal-eyebrow">Library</span>
            <h2 className="modal-title">Factions</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <Glyph name="close" size={16}/>
          </button>
        </header>

        <div className="kw-modal-body">
          <div className="kw-list">
            <div className="kw-list-head">
              <span>{factions.length} factions</span>
              <button type="button" className="btn btn-primary btn-sm"
                      onClick={() => setEditing('new')}>
                <Glyph name="plus" size={12}/><span>New faction</span>
              </button>
            </div>
            <ul>
              {editing === null ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={factions.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    {factions.map(rawF => (
                      <SortableFactionItem key={rawF.id} rawF={rawF} onEdit={() => setEditing(rawF.id)}/>
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                factions.map(rawF => {
                  const f = deriveFaction(rawF);
                  return (
                    <li key={f.id}
                        className={`kw-list-item ${editing === f.id ? 'on' : ''}`}
                        onClick={() => setEditing(f.id)}>
                      <span className="theme-list-swatch"
                            style={{ background: `linear-gradient(160deg, ${f.bg[1]}, ${f.bg[2]})` }}>
                        <Glyph name={rawF.glyph} size={18}/>
                      </span>
                      <span className="kw-list-text">
                        <span className="kw-list-name" style={{ color: f.accent }}>{f.name}</span>
                        <span className="kw-list-desc" style={{ fontFamily: 'ui-monospace, monospace' }}>
                          {rawF.primary}
                        </span>
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          <div className="kw-detail">
            {!editingF ? (
              <div className="kw-empty">
                <Glyph name="palette" size={32}/>
                <p>Select a faction to edit, or create a new one.</p>
              </div>
            ) : (
              <FactionEditor key={editingF.id} faction={editingF}
                             onSave={onSave}
                             onCancel={() => setEditing(null)}
                             onDelete={editingF.id !== '_new' ? () => onDelete(editingF.id) : undefined}/>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FactionEditorProps {
  faction: Faction;
  onSave: (f: Faction) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

function FactionEditor({ faction, onSave, onCancel, onDelete }: FactionEditorProps): React.ReactElement {
  const [draft, setDraft] = useState<Faction>(faction);
  const set = (patch: Partial<Faction>) => setDraft(d => ({ ...d, ...patch }));
  const derived = deriveFaction(draft);

  return (
    <div className="kw-editor">
      <div className="theme-preview"
           style={{ background: `linear-gradient(160deg, ${derived.bg[1]} 0%, ${derived.bg[2]} 100%)` }}>
        <div className="theme-preview-glyph" style={{ color: derived.bg[3] }}>
          <Glyph name={draft.glyph} size={64}/>
        </div>
        <div className="theme-preview-name" style={{ color: derived.bg[3] }}>
          {draft.name || 'Faction'}
        </div>
        <div className="theme-preview-swatches">
          {derived.bg.map((c, i) => (
            <span key={i} className="theme-preview-swatch" style={{ background: c }}/>
          ))}
        </div>
      </div>

      <label className="field">
        <span className="field-label">Name</span>
        <input className="text-input" type="text" value={draft.name}
               placeholder="e.g. Storm"
               onChange={(e) => set({ name: e.target.value })}/>
      </label>

      <div className="field">
        <span className="field-label">Glyph</span>
        <GlyphPicker
          value={draft.glyph}
          accentColor={derived.accent}
          onChange={(g: ThematicGlyphName) => set({ glyph: g })}
        />
      </div>

      <div className="field">
        <span className="field-label">Primary color</span>
        <span className="field-hint" style={{ marginBottom: 6 }}>
          Drives parchment, frame fill, and accent highlights.
        </span>
        <div className="color-row">
          {FACTION_PRESET_COLORS.map(c => (
            <button type="button" key={c}
                    className={`color-pick ${draft.primary === c ? 'on' : ''}`}
                    onClick={() => set({ primary: c })}
                    style={{ background: c }}/>
          ))}
          <input type="color" className="color-custom" value={draft.primary}
                 onChange={(e) => set({ primary: e.target.value })}/>
        </div>
      </div>

      <div className="kw-editor-actions">
        {onDelete && (
          <button type="button" className="btn btn-danger" onClick={onDelete}>
            <Glyph name="trash" size={12}/><span>Delete</span>
          </button>
        )}
        <span style={{ flex: 1 }}/>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-primary"
                disabled={!draft.name.trim()}
                onClick={() => onSave({ ...draft, name: draft.name.trim() })}>
          {faction.id === '_new' ? 'Create' : 'Save'}
        </button>
      </div>
    </div>
  );
}
