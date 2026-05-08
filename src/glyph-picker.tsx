import React, { useMemo, useState } from 'react';
import { Glyph } from './glyphs';
import { GLYPH_CATALOG, CATALOG_CATEGORIES } from './glyph-catalog';
import type { ThematicGlyphName } from './types';

interface GlyphPickerProps {
  value: ThematicGlyphName;
  onChange: (g: ThematicGlyphName) => void;
  accentColor?: string;
}

export function GlyphPicker({ value, onChange, accentColor }: GlyphPickerProps): React.ReactElement {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const filtered = useMemo<ThematicGlyphName[]>(() => {
    const sections =
      activeCategory === 'All'
        ? GLYPH_CATALOG
        : GLYPH_CATALOG.filter(s => s.category === activeCategory);

    const q = query.trim().toLowerCase();
    if (!q) return sections.flatMap(s => [...s.glyphs]);

    return sections.flatMap(s =>
      s.glyphs.filter(g => g.includes(q))
    );
  }, [query, activeCategory]);

  return (
    <div className="glyph-picker">
      <input
        className="text-input glyph-picker-search"
        type="search"
        placeholder="Search glyphs…"
        value={query}
        aria-label="Search glyphs"
        onChange={e => setQuery(e.target.value)}
      />
      <div className="glyph-picker-cats" role="group" aria-label="Glyph categories">
        {(['All', ...CATALOG_CATEGORIES] as const).map(cat => (
          <button
            key={cat}
            type="button"
            className={`glyph-cat${activeCategory === cat ? ' on' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="glyph-picker-grid">
        {filtered.length === 0 ? (
          <span className="glyph-picker-empty">No matches</span>
        ) : (
          filtered.map(g => (
            <button
              key={g}
              type="button"
              className={`glyph-pick${value === g ? ' on' : ''}`}
              style={value === g && accentColor
                ? { color: accentColor, borderColor: accentColor }
                : undefined}
              aria-label={`Select ${g}`}
              aria-pressed={value === g}
              title={g}
              onClick={() => onChange(g)}
            >
              <Glyph name={g} size={18}/>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
