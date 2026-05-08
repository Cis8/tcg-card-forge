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
import { Glyph, RarityShape } from './glyphs';
import { RARITY_SHAPE_OPTIONS } from './data';
import type { Rarity, RarityShapeName } from './types';

const RARITY_PRESET_COLORS = [
  '#a9aeb6', '#3da0e6', '#b466e6', '#f1b637',
  '#e84545', '#27c2a0', '#ff7a59', '#5d6b8a',
];

interface RarityManagerProps {
  open: boolean;
  rarities: Rarity[];
  onClose: () => void;
  onChange: (rarities: Rarity[]) => void;
  onCardRarityMissing?: (oldId: string, newId: string) => void;
}

function SortableRarityItem({ r, onEdit }: { r: Rarity; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: r.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <li ref={setNodeRef} style={style} className="kw-list-item" onClick={onEdit}>
      <span {...attributes} {...listeners}
            onClick={(e) => e.stopPropagation()}
            style={{ cursor: 'grab', padding: '4px 6px', color: 'rgba(0,0,0,.35)', touchAction: 'none', userSelect: 'none', flexShrink: 0 }}
            aria-label="Drag to reorder">⋮⋮</span>
      <span className="rarity-list-swatch">
        <RarityShape shape={r.shape} color={r.color} size={26}/>
      </span>
      <span className="kw-list-text">
        <span className="kw-list-name" style={{ color: r.color }}>{r.name}</span>
        <span className="kw-list-desc" style={{ fontFamily: 'ui-monospace, monospace' }}>
          {r.shape} · {r.color}
        </span>
      </span>
    </li>
  );
}

export function RarityManager({ open, rarities, onClose, onChange, onCardRarityMissing }: RarityManagerProps): React.ReactElement | null {
  const [editing, setEditing] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  if (!open) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = rarities.findIndex(r => r.id === active.id);
      const newIndex = rarities.findIndex(r => r.id === over.id);
      onChange(arrayMove(rarities, oldIndex, newIndex));
    }
  };

  const onSave = (r: Rarity) => {
    if (r.id === '_new') {
      const id = `r_${Date.now().toString(36)}`;
      onChange([...rarities, { ...r, id }]);
    } else {
      onChange(rarities.map(x => x.id === r.id ? r : x));
    }
    setEditing(null);
  };

  const onDelete = (id: string) => {
    if (rarities.length <= 1) { alert('Keep at least one rarity.'); return; }
    if (!confirm('Delete this rarity? Cards using it will fall back to the first remaining rarity.')) return;
    const remaining = rarities.filter(r => r.id !== id);
    onChange(remaining);
    if (onCardRarityMissing) onCardRarityMissing(id, remaining[0].id);
    setEditing(null);
  };

  const editingR: Rarity | undefined = editing === 'new'
    ? { id: '_new', name: '', shape: 'diamond', color: RARITY_PRESET_COLORS[0] }
    : rarities.find(r => r.id === editing);

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal kw-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <span className="modal-eyebrow">Library</span>
            <h2 className="modal-title">Rarities</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <Glyph name="close" size={16}/>
          </button>
        </header>

        <div className="kw-modal-body">
          <div className="kw-list">
            <div className="kw-list-head">
              <span>{rarities.length} rarities</span>
              <button type="button" className="btn btn-primary btn-sm"
                      onClick={() => setEditing('new')}>
                <Glyph name="plus" size={12}/><span>New rarity</span>
              </button>
            </div>
            <ul>
              {editing === null ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={rarities.map(r => r.id)} strategy={verticalListSortingStrategy}>
                    {rarities.map(r => (
                      <SortableRarityItem key={r.id} r={r} onEdit={() => setEditing(r.id)}/>
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                rarities.map(r => (
                  <li key={r.id}
                      className={`kw-list-item ${editing === r.id ? 'on' : ''}`}
                      onClick={() => setEditing(r.id)}>
                    <span className="rarity-list-swatch">
                      <RarityShape shape={r.shape} color={r.color} size={26}/>
                    </span>
                    <span className="kw-list-text">
                      <span className="kw-list-name" style={{ color: r.color }}>{r.name}</span>
                      <span className="kw-list-desc" style={{ fontFamily: 'ui-monospace, monospace' }}>
                        {r.shape} · {r.color}
                      </span>
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="kw-detail">
            {!editingR ? (
              <div className="kw-empty">
                <Glyph name="gem" size={32}/>
                <p>Select a rarity to edit, or create a new one.</p>
              </div>
            ) : (
              <RarityEditor key={editingR.id} rarity={editingR}
                            onSave={onSave}
                            onCancel={() => setEditing(null)}
                            onDelete={editingR.id !== '_new' ? () => onDelete(editingR.id) : undefined}/>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface RarityEditorProps {
  rarity: Rarity;
  onSave: (r: Rarity) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

function RarityEditor({ rarity, onSave, onCancel, onDelete }: RarityEditorProps): React.ReactElement {
  const [draft, setDraft] = useState<Rarity>(rarity);
  const set = (patch: Partial<Rarity>) => setDraft(d => ({ ...d, ...patch }));

  return (
    <div className="kw-editor">
      <div className="rarity-preview">
        <RarityShape shape={draft.shape} color={draft.color} size={72}/>
        <div className="rarity-preview-name" style={{ color: draft.color }}>
          {draft.name || 'Rarity'}
        </div>
      </div>

      <label className="field">
        <span className="field-label">Name</span>
        <input className="text-input" type="text" value={draft.name}
               placeholder="e.g. Mythic"
               onChange={(e) => set({ name: e.target.value })}/>
      </label>

      <div className="field">
        <span className="field-label">Shape</span>
        <div className="shape-grid">
          {RARITY_SHAPE_OPTIONS.map(s => (
            <button type="button" key={s}
                    className={`shape-pick ${draft.shape === s ? 'on' : ''}`}
                    onClick={() => set({ shape: s as RarityShapeName })}>
              <RarityShape shape={s} color={draft.color} size={28}/>
              <span>{s}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">Color</span>
        <div className="color-row">
          {RARITY_PRESET_COLORS.map(c => (
            <button type="button" key={c}
                    className={`color-pick ${draft.color === c ? 'on' : ''}`}
                    onClick={() => set({ color: c })}
                    style={{ background: c }}/>
          ))}
          <input type="color" className="color-custom" value={draft.color}
                 onChange={(e) => set({ color: e.target.value })}/>
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
          {rarity.id === '_new' ? 'Create' : 'Save'}
        </button>
      </div>
    </div>
  );
}
