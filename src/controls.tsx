import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useServices } from './context/ServicesContext';
import { deriveFaction } from './color-utils';
import { PATTERNS } from './data';
import { Glyph, RarityShape } from './glyphs';
import { GlyphPicker } from './glyph-picker';
import { confirmDestructiveAction } from './confirm';
import type { Card, CardWithArt, ImageHandle, Keyword, Faction, Rarity, GlyphName, GlobalSettings, DeckSettings, ThematicGlyphName, DescGlyph } from './types';

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

const GEM_SHAPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'gem',     label: 'Gem' },
  { value: 'shield',  label: 'Shield' },
  { value: 'circle',  label: 'Disc' },
  { value: 'rhombus', label: 'Rhombus' },
  { value: 'heart',   label: 'Heart' },
];

const ShapeSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }): React.ReactElement => (
  <select className="shape-select" value={value} onChange={e => onChange(e.target.value)}>
    {GEM_SHAPE_OPTIONS.map(o => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
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

interface FactionPickerProps {
  factions: Faction[];
  value: string;
  onChange: (v: string) => void;
  onManage: () => void;
}

const FactionPicker = ({ factions, value, onChange, onManage }: FactionPickerProps): React.ReactElement => (
  <div>
    <div className="theme-grid">
      {factions.map(rawF => {
        const f = deriveFaction(rawF);
        return (
          <button type="button" key={f.id}
                  className={`theme-chip ${value === f.id ? 'on' : ''}`}
                  title={f.name}
                  onClick={() => onChange(f.id)}
                  style={{
                    background: `linear-gradient(160deg, ${f.bg[1]} 0%, ${f.bg[2]} 100%)`,
                    boxShadow: value === f.id
                      ? `0 0 0 2px ${f.accent}, 0 0 0 3px #1a1306, 0 4px 14px ${f.bg[2]}66`
                      : '0 0 0 1px rgba(0,0,0,.18), 0 1px 4px rgba(0,0,0,.18)',
                  }}>
            <span className="theme-chip-glyph" style={{ color: f.bg[3] }}>
              <Glyph name={rawF.glyph} size={22}/>
            </span>
            <span className="theme-chip-label">{f.name}</span>
          </button>
        );
      })}
    </div>
    <button type="button" className="rail-manage-link" onClick={onManage}>
      <Glyph name="palette" size={12}/>
      <span>Manage factions…</span>
    </button>
  </div>
);

const STAT_PRESET_COLORS = [
  '#5dbce5', '#e23a3a', '#cfd6dd', '#f1b637',
  '#b466e6', '#4f8a3a', '#ff7a59', '#3da0e6',
];

interface SmartColorPickerProps {
  value: string;
  onChange: (v: string) => void;
  label: string;
}

function SmartColorPicker({ value, onChange, label }: SmartColorPickerProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const swatchRef = React.useRef<HTMLButtonElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    if (!swatchRef.current) return;
    const rect = swatchRef.current.getBoundingClientRect();
    const popW = 172;
    const popH = 120;
    let left = rect.left;
    let top = rect.bottom + 6;
    if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
    if (top + popH > window.innerHeight - 8) top = rect.top - popH - 6;
    setPos({ top, left });
    setOpen(true);
  };

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        swatchRef.current && !swatchRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <button
        ref={swatchRef}
        type="button"
        onClick={handleOpen}
        title={`${label}: ${value}`}
        style={{
          width: 28, height: 28, borderRadius: 6, background: value,
          border: '2px solid rgba(255,230,180,.25)', cursor: 'pointer',
          padding: 0, flexShrink: 0,
          boxShadow: open ? `0 0 0 2px rgba(255,230,180,.5)` : undefined,
        }}
      />
      <span style={{ fontSize: 10, color: 'rgba(255,230,180,.45)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</span>
      {open && ReactDOM.createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed', top: pos.top, left: pos.left,
            background: '#1d1813', border: '1px solid rgba(255,230,180,.16)',
            borderRadius: 8, padding: 10, zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,.6)',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
            {STAT_PRESET_COLORS.map(c => (
              <button key={c} type="button"
                onClick={() => { onChange(c); setOpen(false); }}
                style={{
                  width: 28, height: 28, borderRadius: 5, background: c, padding: 0,
                  border: value === c ? '2px solid rgba(255,230,180,.8)' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="color" value={value}
              onChange={(e) => onChange(e.target.value)}
              style={{ width: 28, height: 28, padding: 1, border: '1px solid rgba(255,230,180,.2)', borderRadius: 4, cursor: 'pointer', background: 'transparent' }}
            />
            <span style={{ fontSize: 10.5, color: 'rgba(240,230,200,.55)', fontFamily: 'ui-monospace, monospace' }}>{value}</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

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
  artHandle: ImageHandle | null;
  onChange: (handle: ImageHandle | null) => void;
}

const ArtUploader = ({ artHandle, onChange }: ArtUploaderProps): React.ReactElement => {
  const { imageService } = useServices();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f || !f.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const handle = await imageService.storeFromFile(f);
      onChange(handle);
    } finally {
      setUploading(false);
    }
  };

  const previewUrl = artHandle?.objectUrl ?? null;

  return (
    <div>
      <div className={`art-drop ${drag ? 'drag' : ''} ${previewUrl ? 'has' : ''}`}
           onClick={() => !uploading && inputRef.current?.click()}
           onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
           onDragLeave={() => setDrag(false)}
           onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}>
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="" className="art-drop-preview"/>
            <span className="art-drop-overlay">{uploading ? 'Processing…' : 'Click or drop to replace'}</span>
          </>
        ) : (
          <div className="art-drop-empty">
            <Glyph name="upload" size={20}/>
            <span>{uploading ? 'Processing…' : 'Drop a PNG/JPG, or click to browse'}</span>
            <span className="art-drop-hint">Otherwise the theme color fills the art window</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" hidden
               onClick={(e) => e.stopPropagation()}
               onChange={(e) => handleFiles(e.target.files)}/>
      </div>
      {previewUrl && !uploading && (
        <button type="button" className="btn btn-sm btn-ghost art-clear"
                onClick={() => {
                  if (!confirmDestructiveAction('Remove this image from the card?')) return;
                  onChange(null);
                }}>
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
  deckSettings: DeckSettings;
  onDeckSettingChange: (k: keyof DeckSettings, v: number) => void;
}

export function LeftPanel({ card, onChange, keywords, onOpenKeywords, deckSettings, onDeckSettingChange }: LeftPanelProps): React.ReactElement {
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
          <Stepper value={card.cost ?? 0} min={0} max={99}
                   onChange={(v) => onChange({ cost: v })}/>
        </Field>
        {isUnit && (
          <div className="row-2">
            <Field label="Attack">
              <Stepper value={card.attack ?? 0} min={0} max={99}
                       onChange={(v) => onChange({ attack: v })}/>
            </Field>
            <Field label="Health">
              <Stepper value={card.health ?? 1} min={1} max={99}
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

      {/* ── Gameplay Rules ──────────────────────────────────────────── */}
      <div className="rail-global-section">
        <div className="rail-global-header">
          <span className="rail-global-title">Gameplay Rules</span>
          <span className="rail-global-badge">All decks</span>
        </div>
        <Field label="Max copies per card" hint="How many copies of one card a deck can hold">
          <Stepper
            value={deckSettings.maxCopiesPerCard}
            min={1}
            max={10}
            onChange={(v) => onDeckSettingChange('maxCopiesPerCard', v)}
          />
        </Field>
        <Field label="Min deck size" hint="Minimum number of cards in a valid deck">
          <Stepper
            value={deckSettings.minDeckSize}
            min={1}
            max={deckSettings.maxDeckSize}
            onChange={(v) => onDeckSettingChange('minDeckSize', v)}
          />
        </Field>
        <Field label="Max deck size" hint="Maximum number of cards allowed in a deck">
          <Stepper
            value={deckSettings.maxDeckSize}
            min={deckSettings.minDeckSize}
            max={200}
            onChange={(v) => onDeckSettingChange('maxDeckSize', v)}
          />
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

// ── Description Box controls ─────────────────────────────────────────────

type GlyphWatermarkMode = 'none' | 'faction' | 'custom';

interface DescriptionBoxFieldProps {
  card: CardWithArt;
  factions: Faction[];
  onChange: (patch: Partial<CardWithArt>) => void;
}

function DescriptionBoxField({ card, factions, onChange }: DescriptionBoxFieldProps): React.ReactElement {
  const factionRaw = factions.find(f => f.id === card.faction) ?? factions[0];

  const mode: GlyphWatermarkMode =
    card.descGlyph === 'none' ? 'none'
    : !card.descGlyph || card.descGlyph === 'faction' ? 'faction'
    : 'custom';

  const customGlyph: ThematicGlyphName =
    mode === 'custom' ? (card.descGlyph as ThematicGlyphName) : factionRaw.glyph;

  const bgValue = typeof card.descBg === 'string' ? card.descBg : '#d4b896';

  const handleModeChange = (m: string) => {
    if (m === 'none')    onChange({ descGlyph: 'none' });
    if (m === 'faction') onChange({ descGlyph: 'faction' });
    if (m === 'custom')  onChange({ descGlyph: customGlyph });
  };

  return (
    <>
      <Field label="Box background" hint="Base parchment colour for the description panel">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <SmartColorPicker
            value={bgValue}
            onChange={(v) => onChange({ descBg: v })}
            label="Color"
          />
          {card.descBg && (
            <button type="button" className="btn btn-sm btn-ghost"
                    style={{ fontSize: 11 }}
                    onClick={() => onChange({ descBg: null })}>
              Reset
            </button>
          )}
        </div>
      </Field>
      <Field label="Box watermark" hint="Decorative glyph behind the card text">
        <Seg
          value={mode}
          options={[
            { value: 'none',    label: 'Off' },
            { value: 'faction', label: 'Faction' },
            { value: 'custom',  label: 'Custom' },
          ]}
          onChange={handleModeChange}
        />
        {mode === 'custom' && (
          <div style={{ marginTop: 8 }}>
            <GlyphPicker
              value={customGlyph}
              onChange={(g: ThematicGlyphName) => onChange({ descGlyph: g as DescGlyph })}
            />
          </div>
        )}
      </Field>
    </>
  );
}

interface RightPanelProps {
  card: CardWithArt;
  onChange: (patch: Partial<CardWithArt>) => void;
  factions: Faction[];
  rarities: Rarity[];
  onManageFactions: () => void;
  onManageRarities: () => void;
  globalSettings: GlobalSettings;
  onGlobalSettingChange: (k: keyof GlobalSettings, v: string) => void;
}

export function RightPanel({ card, onChange, factions, rarities, onManageFactions, onManageRarities, globalSettings, onGlobalSettingChange }: RightPanelProps): React.ReactElement {
  return (
    <aside className="rail rail-right">
      <header className="rail-header">
        <span className="rail-eyebrow">Visual</span>
        <h2 className="rail-title">Appearance</h2>
      </header>
      <div className="rail-body">

        {/* ── Card-specific settings ───────────────────────────────────── */}
        <div className="rail-card-section-header">
          <span className="rail-card-section-title">This Card</span>
        </div>
        <Field label="Faction" hint="Drives palette, parchment tint and glyph">
          <FactionPicker factions={factions} value={card.faction}
                         onChange={(v) => onChange({ faction: v })}
                         onManage={onManageFactions}/>
        </Field>
        <Field label="Splash art" hint="Drop your own PNG / JPG, or leave blank for faction color">
          <ArtUploader artHandle={card.artHandle ?? null} onChange={(handle) => onChange({ artId: handle?.id ?? null, artHandle: handle })}/>
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
          <Seg value={card.frame}
               options={[
                 { value: 'ornate',    label: 'Ornate' },
                 { value: 'classic',   label: 'Classic' },
                 { value: 'inscribed', label: 'Inscribed' },
               ]}
               onChange={(v) => onChange({ frame: v as Card['frame'] })}/>
        </Field>
        <DescriptionBoxField card={card} factions={factions} onChange={onChange}/>
      </div>

      {/* ── Global settings ─────────────────────────────────────────── */}
        <div className="rail-global-section">
          <div className="rail-global-header">
            <span className="rail-global-title">Global Settings</span>
            <span className="rail-global-badge">All cards</span>
          </div>
          <Field label="Font set">
            <Seg value={globalSettings.font}
                 options={[
                   { value: 'cinzel',  label: 'Cinzel' },
                   { value: 'fell',    label: 'IM Fell' },
                   { value: 'trajan',  label: 'Decorative' },
                 ]}
                 onChange={(v) => onGlobalSettingChange('font', v)}/>
          </Field>
          <Field label="Cost gem">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <SmartColorPicker value={globalSettings.costColor} onChange={(v) => onGlobalSettingChange('costColor', v)} label="Color"/>
              <ShapeSelect value={globalSettings.costShape} onChange={(v) => onGlobalSettingChange('costShape', v)}/>
            </div>
          </Field>
          <Field label="Attack gem">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <SmartColorPicker value={globalSettings.attackColor} onChange={(v) => onGlobalSettingChange('attackColor', v)} label="Color"/>
              <ShapeSelect value={globalSettings.attackShape} onChange={(v) => onGlobalSettingChange('attackShape', v)}/>
            </div>
          </Field>
          <Field label="Health gem">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <SmartColorPicker value={globalSettings.healthColor} onChange={(v) => onGlobalSettingChange('healthColor', v)} label="Color"/>
              <ShapeSelect value={globalSettings.healthShape} onChange={(v) => onGlobalSettingChange('healthShape', v)}/>
            </div>
          </Field>
        </div>
    </aside>
  );
}
