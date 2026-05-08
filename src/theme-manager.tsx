import React, { useState } from 'react';
import { deriveTheme } from './color-utils';
import { Glyph } from './glyphs';
import { THEME_GLYPH_OPTIONS } from './data';
import type { Theme, GlyphName } from './types';

const THEME_PRESET_COLORS = [
  '#c84a18', '#d97706', '#e1a526',
  '#4f8a3a', '#0e7490', '#3d8ec9',
  '#7a3da8', '#9d174d', '#475569',
];

interface ThemeManagerProps {
  open: boolean;
  themes: Theme[];
  onClose: () => void;
  onChange: (themes: Theme[]) => void;
  onCardThemeMissing?: (oldId: string, newId: string) => void;
}

export function ThemeManager({ open, themes, onClose, onChange, onCardThemeMissing }: ThemeManagerProps): React.ReactElement | null {
  const [editing, setEditing] = useState<string | null>(null);
  if (!open) return null;

  const onSave = (t: Theme) => {
    if (t.id === '_new') {
      const id = `t_${Date.now().toString(36)}`;
      onChange([...themes, { ...t, id }]);
    } else {
      onChange(themes.map(x => x.id === t.id ? t : x));
    }
    setEditing(null);
  };

  const onDelete = (id: string) => {
    if (themes.length <= 1) { alert('Keep at least one theme.'); return; }
    if (!confirm('Delete this theme? Cards using it will fall back to the first remaining theme.')) return;
    const remaining = themes.filter(t => t.id !== id);
    onChange(remaining);
    if (onCardThemeMissing) onCardThemeMissing(id, remaining[0].id);
    setEditing(null);
  };

  const editingT: Theme | undefined = editing === 'new'
    ? { id: '_new', name: '', glyph: 'flame', primary: THEME_PRESET_COLORS[0] }
    : themes.find(t => t.id === editing);

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal kw-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <span className="modal-eyebrow">Library</span>
            <h2 className="modal-title">Themes</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <Glyph name="close" size={16}/>
          </button>
        </header>

        <div className="kw-modal-body">
          <div className="kw-list">
            <div className="kw-list-head">
              <span>{themes.length} themes</span>
              <button type="button" className="btn btn-primary btn-sm"
                      onClick={() => setEditing('new')}>
                <Glyph name="plus" size={12}/><span>New theme</span>
              </button>
            </div>
            <ul>
              {themes.map(rawT => {
                const t = deriveTheme(rawT);
                return (
                  <li key={t.id}
                      className={`kw-list-item ${editing === t.id ? 'on' : ''}`}
                      onClick={() => setEditing(t.id)}>
                    <span className="theme-list-swatch"
                          style={{ background: `linear-gradient(160deg, ${t.bg[1]}, ${t.bg[2]})` }}>
                      <Glyph name={rawT.glyph} size={18}/>
                    </span>
                    <span className="kw-list-text">
                      <span className="kw-list-name" style={{ color: t.accent }}>{t.name}</span>
                      <span className="kw-list-desc" style={{ fontFamily: 'ui-monospace, monospace' }}>
                        {rawT.primary}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="kw-detail">
            {!editingT ? (
              <div className="kw-empty">
                <Glyph name="palette" size={32}/>
                <p>Select a theme to edit, or create a new one.</p>
              </div>
            ) : (
              <ThemeEditor key={editingT.id} theme={editingT}
                           onSave={onSave}
                           onCancel={() => setEditing(null)}
                           onDelete={editingT.id !== '_new' ? () => onDelete(editingT.id) : undefined}/>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ThemeEditorProps {
  theme: Theme;
  onSave: (t: Theme) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

function ThemeEditor({ theme, onSave, onCancel, onDelete }: ThemeEditorProps): React.ReactElement {
  const [draft, setDraft] = useState<Theme>(theme);
  const set = (patch: Partial<Theme>) => setDraft(d => ({ ...d, ...patch }));
  const derived = deriveTheme(draft);

  return (
    <div className="kw-editor">
      <div className="theme-preview"
           style={{ background: `linear-gradient(160deg, ${derived.bg[1]} 0%, ${derived.bg[2]} 100%)` }}>
        <div className="theme-preview-glyph" style={{ color: derived.bg[3] }}>
          <Glyph name={draft.glyph} size={64}/>
        </div>
        <div className="theme-preview-name" style={{ color: derived.bg[3] }}>
          {draft.name || 'Theme'}
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
        <div className="glyph-grid">
          {THEME_GLYPH_OPTIONS.map(g => (
            <button type="button" key={g}
                    className={`glyph-pick ${draft.glyph === g ? 'on' : ''}`}
                    style={draft.glyph === g ? { color: derived.accent, borderColor: derived.accent } : undefined}
                    onClick={() => set({ glyph: g as GlyphName })}>
              <Glyph name={g} size={18}/>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">Primary color</span>
        <span className="field-hint" style={{ marginBottom: 6 }}>
          Drives parchment, frame fill, and accent highlights.
        </span>
        <div className="color-row">
          {THEME_PRESET_COLORS.map(c => (
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
          {theme.id === '_new' ? 'Create' : 'Save'}
        </button>
      </div>
    </div>
  );
}
