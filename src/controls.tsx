import React, { useState, useRef } from 'react';
import { deriveTheme } from './color-utils';
import { PATTERNS } from './data';
import { Glyph, RarityShape } from './glyphs';
import type { Card, Keyword, Theme, Rarity, GlyphName, TweakState } from './types';

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

const Field = ({ label, hint, children }: FieldProps): React.ReactElement => (
  <label className="field">
    <span className="field-label">{label}</span>
    {children}
    {hint ? <span className="field-hint">{hint}</span> : null}
  </label>
);

type SegOption = string | { value: string; label: string };

interface SegProps {
  value: string;
  options: SegOption[];
  onChange: (v: string) => void;
  columns?: number;
}

const Seg = ({ value, options, onChange, columns }: SegProps): React.ReactElement => (
  <div className="seg" style={columns ? { gridTemplateColumns: `repeat(${columns},1fr)` } : undefined}>
    {options.map(o => {
      const v = typeof o === 'object' ? o.value : o;
      const l = typeof o === 'object' ? o.label : o;
      return (
        <button type="button" key={v} className={`seg-btn ${value === v ? 'on' : ''}`}
                onClick={() => onChange(v)}>{l}</button>
      );
    })}
  </div>
);

interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}

const Stepper = ({ value, min = 0, max = 99, onChange }: StepperProps): React.ReactElement => (
  <div className="stepper">
    <button type="button" className="stepper-btn" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
    <input type="number" min={min} max={max} value={value}
           onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}/>
    <button type="button" className="stepper-btn" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
  </div>
);

interface ThemePickerProps {
  themes: Theme[];
  value: string;
  onChange: (v: string) => void;
  onManage: () => void;
}

const ThemePicker = ({ themes, value, onChange, onManage }: ThemePickerProps): React.ReactElement => (
  <div>
    <div className="theme-grid">
      {themes.map(rawT => {
        const t = deriveTheme(rawT);
        return (
          <button type="button" key={t.id}
                  className={`theme-chip ${value === t.id ? 'on' : ''}`}
                  title={t.name}
                  onClick={() => onChange(t.id)}
                  style={{
                    background: `linear-gradient(160deg, ${t.bg[1]} 0%, ${t.bg[2]} 100%)`,
                    boxShadow: value === t.id
                      ? `0 0 0 2px ${t.accent}, 0 0 0 3px #1a1306, 0 4px 14px ${t.bg[2]}66`
                      : '0 0 0 1px rgba(0,0,0,.18), 0 1px 4px rgba(0,0,0,.18)',
                  }}>
            <span className="theme-chip-glyph" style={{ color: t.bg[3] }}>
              <Glyph name={rawT.glyph} size={22}/>
            </span>
            <span className="theme-chip-label">{t.name}</span>
          </button>
        );
      })}
    </div>
    <button type="button" className="rail-manage-link" onClick={onManage}>
      <Glyph name="palette" size={12}/>
      <span>Manage themes…</span>
    </button>
  </div>
);

interface RarityPickerProps {
  rarities: Rarity[];
  value: string;
  onChange: (v: string) => void;
  onManage: () => void;
}

const RarityPicker = ({ rarities, value, onChange, onManage }: RarityPickerProps): React.ReactElement => (
  <div>
    <div className="rarity-row">
      {rarities.map(r => (
        <button type="button" key={r.id}
                className={`rarity-chip ${value === r.id ? 'on' : ''}`}
                onClick={() => onChange(r.id)} title={r.name}>
          <RarityShape shape={r.shape} color={r.color} size={22}/>
          <span className="rarity-chip-label">{r.name}</span>
        </button>
      ))}
    </div>
    <button type="button" className="rail-manage-link" onClick={onManage}>
      <Glyph name="gem" size={12}/>
      <span>Manage rarities…</span>
    </button>
  </div>
);

interface PatternPickerProps {
  value: string;
  onChange: (v: string) => void;
}

const PatternPicker = ({ value, onChange }: PatternPickerProps): React.ReactElement => (
  <div className="pattern-row">
    {PATTERNS.map(p => (
      <button type="button" key={p}
              className={`pattern-chip ${value === p ? 'on' : ''}`}
              onClick={() => onChange(p)} title={p}>
        <span className={`pattern-thumb pattern-thumb-${p}`}/>
        <span className="pattern-chip-label">{p}</span>
      </button>
    ))}
  </div>
);

interface ArtUploaderProps {
  value: string | null;
  onChange: (v: string | null) => void;
}

const ArtUploader = ({ value, onChange }: ArtUploaderProps): React.ReactElement => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const handleFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (!f || !f.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target!.result as string);
    reader.readAsDataURL(f);
  };
  return (
    <div>
      <div className={`art-drop ${drag ? 'drag' : ''} ${value ? 'has' : ''}`}
           onClick={() => inputRef.current?.click()}
           onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
           onDragLeave={() => setDrag(false)}
           onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}>
        {value ? (
          <>
            <img src={value} alt="" className="art-drop-preview"/>
            <span className="art-drop-overlay">Click or drop to replace</span>
          </>
        ) : (
          <div className="art-drop-empty">
            <Glyph name="upload" size={20}/>
            <span>Drop a PNG/JPG, or click to browse</span>
            <span className="art-drop-hint">Otherwise the theme color fills the art window</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" hidden
               onChange={(e) => handleFiles(e.target.files)}/>
      </div>
      {value && (
        <button type="button" className="btn btn-sm btn-ghost art-clear"
                onClick={() => onChange(null)}>
          <Glyph name="trash" size={11}/>
          <span>Remove image</span>
        </button>
      )}
    </div>
  );
};

interface LeftPanelProps {
  card: Card;
  onChange: (patch: Partial<Card>) => void;
  keywords: Keyword[];
  onOpenKeywords: () => void;
}

export function LeftPanel({ card, onChange, keywords, onOpenKeywords }: LeftPanelProps): React.ReactElement {
  const isUnit = card.type === 'unit';
  return (
    <aside className="rail rail-left">
      <header className="rail-header">
        <span className="rail-eyebrow">Card</span>
        <h2 className="rail-title">Properties</h2>
      </header>
      <div className="rail-body">
        <Field label="Type">
          <Seg value={card.type} columns={2}
               options={[{ value: 'unit', label: 'Unit' }, { value: 'spell', label: 'Spell' }]}
               onChange={(v) => onChange({ type: v as Card['type'] })}/>
        </Field>
        <Field label="Name">
          <input className="text-input" type="text" value={card.name}
                 placeholder="e.g. Ashen Warden"
                 onChange={(e) => onChange({ name: e.target.value })}/>
        </Field>
        <Field label={isUnit ? 'Type line' : 'School'}
               hint={isUnit ? 'e.g. Drake · Sentinel' : 'e.g. Hex'}>
          <input className="text-input" type="text" value={card.subtype || ''}
                 onChange={(e) => onChange({ subtype: e.target.value })}/>
        </Field>
        <Field label="Cost" hint="Mana cost to cast">
          <Stepper value={card.cost ?? 0} min={0} max={20}
                   onChange={(v) => onChange({ cost: v })}/>
        </Field>
        {isUnit && (
          <div className="row-2">
            <Field label="Attack">
              <Stepper value={card.attack ?? 0} min={0} max={30}
                       onChange={(v) => onChange({ attack: v })}/>
            </Field>
            <Field label="Health">
              <Stepper value={card.health ?? 1} min={1} max={30}
                       onChange={(v) => onChange({ health: v })}/>
            </Field>
          </div>
        )}
        <Field label="Description"
               hint='Wrap keywords in [brackets] — e.g. [Last Breath]'>
          <textarea className="text-input text-area" rows={5}
                    value={card.description || ''}
                    placeholder="Describe the card's effect…"
                    onChange={(e) => onChange({ description: e.target.value })}/>
          <KeywordChipBar keywords={keywords}
                          onInsert={(name) => {
                            const insert = `[${name}]`;
                            const cur = card.description || '';
                            const next = cur && !/[\s\n]$/.test(cur) ? `${cur} ${insert}` : `${cur}${insert}`;
                            onChange({ description: next });
                          }}
                          onManage={onOpenKeywords}/>
        </Field>
        <Field label="Flavor text" hint="Italic line at the bottom (optional)">
          <textarea className="text-input text-area" rows={2}
                    value={card.flavor || ''}
                    placeholder='"A short evocative quote."'
                    onChange={(e) => onChange({ flavor: e.target.value })}/>
        </Field>
      </div>
    </aside>
  );
}

interface KeywordChipBarProps {
  keywords: Keyword[];
  onInsert: (name: string) => void;
  onManage: () => void;
}

function KeywordChipBar({ keywords, onInsert, onManage }: KeywordChipBarProps): React.ReactElement {
  return (
    <div className="kw-bar">
      <span className="kw-bar-label">Insert keyword</span>
      <div className="kw-bar-chips">
        {keywords.map(k => (
          <button type="button" key={k.id} className="kw-bar-chip"
                  style={{ color: k.color }} title={k.description}
                  onClick={() => onInsert(k.name)}>
            <Glyph name={k.glyph as GlyphName} size={12}/><span>{k.name}</span>
          </button>
        ))}
        <button type="button" className="kw-bar-manage" onClick={onManage}>
          <Glyph name="edit" size={12}/><span>Manage…</span>
        </button>
      </div>
    </div>
  );
}

interface RightPanelProps {
  card: Card;
  onChange: (patch: Partial<Card>) => void;
  themes: Theme[];
  rarities: Rarity[];
  onManageThemes: () => void;
  onManageRarities: () => void;
  tweaks: TweakState;
  onTweakChange: (k: keyof TweakState, v: string) => void;
}

export function RightPanel({ card, onChange, themes, rarities, onManageThemes, onManageRarities, tweaks, onTweakChange }: RightPanelProps): React.ReactElement {
  return (
    <aside className="rail rail-right">
      <header className="rail-header">
        <span className="rail-eyebrow">Visual</span>
        <h2 className="rail-title">Appearance</h2>
      </header>
      <div className="rail-body">
        <Field label="Theme" hint="Drives palette, parchment tint and glyph">
          <ThemePicker themes={themes} value={card.theme}
                       onChange={(v) => onChange({ theme: v })}
                       onManage={onManageThemes}/>
        </Field>
        <Field label="Splash art" hint="Drop your own PNG / JPG, or leave blank for theme color">
          <ArtUploader value={card.art} onChange={(v) => onChange({ art: v })}/>
        </Field>
        <Field label="Card pattern" hint="Texture overlay on the card frame">
          <PatternPicker value={card.pattern} onChange={(v) => onChange({ pattern: v as Card['pattern'] })}/>
        </Field>
        <Field label="Rarity">
          <RarityPicker rarities={rarities} value={card.rarity}
                        onChange={(v) => onChange({ rarity: v })}
                        onManage={onManageRarities}/>
        </Field>
        <Field label="Border style">
          <Seg value={tweaks.frame}
               options={[
                 { value: 'ornate',    label: 'Ornate' },
                 { value: 'classic',   label: 'Classic' },
                 { value: 'inscribed', label: 'Inscribed' },
               ]}
               onChange={(v) => onTweakChange('frame', v)}/>
        </Field>
        <Field label="Font set">
          <Seg value={tweaks.font}
               options={[
                 { value: 'cinzel',  label: 'Cinzel' },
                 { value: 'fell',    label: 'IM Fell' },
                 { value: 'trajan',  label: 'Decorative' },
               ]}
               onChange={(v) => onTweakChange('font', v)}/>
        </Field>
        <Field label="Stat shape">
          <Seg value={tweaks.statShape}
               options={[
                 { value: 'gem',    label: 'Gem' },
                 { value: 'shield', label: 'Shield' },
                 { value: 'circle', label: 'Disc' },
               ]}
               onChange={(v) => onTweakChange('statShape', v)}/>
        </Field>
        <Field label="Gem colours">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', color: 'rgba(255, 254, 254, 0.55)' }}>
              <input type="color" value={tweaks.costColor}
                     onChange={(e) => onTweakChange('costColor', e.target.value)}
                     style={{ width: 28, height: 22, padding: 1, border: '1px solid rgba(0,0,0,.15)', borderRadius: 4, cursor: 'pointer' }}/>
              Cost
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', color: 'rgba(255, 254, 254, 0.55)' }}>
              <input type="color" value={tweaks.attackColor}
                     onChange={(e) => onTweakChange('attackColor', e.target.value)}
                     style={{ width: 28, height: 22, padding: 1, border: '1px solid rgba(0,0,0,.15)', borderRadius: 4, cursor: 'pointer' }}/>
              Atk
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', color: 'rgba(255, 254, 254, 0.55)' }}>
              <input type="color" value={tweaks.healthColor}
                     onChange={(e) => onTweakChange('healthColor', e.target.value)}
                     style={{ width: 28, height: 22, padding: 1, border: '1px solid rgba(0,0,0,.15)', borderRadius: 4, cursor: 'pointer' }}/>
              HP
            </label>
          </div>
        </Field>
      </div>
    </aside>
  );
}
