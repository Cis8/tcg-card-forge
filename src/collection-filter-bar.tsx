import React from 'react';
import { Glyph } from './glyphs';
import type { Faction, Keyword } from './types';
import {
  type CollectionFilters,
  hasActiveFilters,
  COST_FILTER_VALUES,
  COST_PLUS_THRESHOLD,
} from './collection-filter';

export interface CollectionFilterBarProps {
  filters:  CollectionFilters;
  factions: Faction[];
  keywords: Keyword[];
  onChange: (f: CollectionFilters) => void;
  onClear:  () => void;
}

export function CollectionFilterBar({
  filters, factions, keywords, onChange, onClear,
}: CollectionFilterBarProps): React.ReactElement {
  const active = hasActiveFilters(filters);

  const toggleFaction = (id: string) =>
    onChange({
      ...filters,
      factions: filters.factions.includes(id)
        ? filters.factions.filter(f => f !== id)
        : [...filters.factions, id],
    });

  const toggleKeyword = (id: string) =>
    onChange({
      ...filters,
      keywords: filters.keywords.includes(id)
        ? filters.keywords.filter(k => k !== id)
        : [...filters.keywords, id],
    });

  const toggleCost = (c: number) =>
    onChange({
      ...filters,
      costs: filters.costs.includes(c)
        ? filters.costs.filter(x => x !== c)
        : [...filters.costs, c],
    });

  return (
    <div className="coll-filter">
      {/* Row 1: search + clear */}
      <div className="coll-filter-row">
        <input
          className="coll-filter-search"
          type="search"
          placeholder="Search name, type, description…"
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
        />
        {active && (
          <button type="button" className="coll-filter-clear" onClick={onClear}>
            Clear all
          </button>
        )}
      </div>

      {/* Row 2: cost chips */}
      <div className="coll-filter-row">
        <span className="coll-filter-label">Cost</span>
        <div className="coll-filter-chips">
          {COST_FILTER_VALUES.map(c => {
            const on = filters.costs.includes(c);
            return (
              <button
                key={c}
                type="button"
                className={`coll-filter-chip coll-filter-chip--cost${on ? ' on' : ''}`}
                onClick={() => toggleCost(c)}
              >
                {c === COST_PLUS_THRESHOLD ? '10+' : c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 3: factions */}
      {factions.length > 0 && (
        <div className="coll-filter-row">
          <span className="coll-filter-label">Faction</span>
          <div className="coll-filter-chips">
            {factions.map(f => {
              const on = filters.factions.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`coll-filter-chip${on ? ' on' : ''}`}
                  style={on ? { borderColor: f.primary, color: f.primary } : undefined}
                  onClick={() => toggleFaction(f.id)}
                >
                  <Glyph name={f.glyph} size={11}/>
                  {f.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Row 4: keywords */}
      {keywords.length > 0 && (
        <div className="coll-filter-row">
          <span className="coll-filter-label">Keywords</span>
          <div className="coll-filter-chips">
            {keywords.map(k => {
              const on = filters.keywords.includes(k.id);
              return (
                <button
                  key={k.id}
                  type="button"
                  className={`coll-filter-chip${on ? ' on' : ''}`}
                  style={on ? { borderColor: k.color, color: k.color } : undefined}
                  onClick={() => toggleKeyword(k.id)}
                >
                  <Glyph name={k.glyph} size={11}/>
                  {k.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
