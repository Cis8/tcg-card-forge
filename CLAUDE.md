# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Type-check + production build (tsc -b && vite build)
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

There are no automated tests. Type checking is done as part of `npm run build`.

## Deployment

Pushes to `main` automatically deploy to GitHub Pages via `.github/workflows/deploy.yml` (uses `peaceiris/actions-gh-pages`).

## Architecture

This is a single-page React + TypeScript app (Vite) for designing TCG cards. There is no backend — all state lives in `localStorage` and all rendering is pure client-side.

### State ownership (`App.tsx`)

`App.tsx` is the single source of truth. It owns and persists:
- `cards` — the saved card collection
- `current` — the card currently being edited
- `factions`, `rarities`, `keywords` — library entities
- `globalSettings` — font, stat gem shapes/colors, deck rules
- `decks` — named deck lists

All of these are persisted via `localStorage` (keys defined in the `STORAGE` constant). Every entity uses versioned keys (e.g. `tcg.cards.v2`) with migration logic for older keys.

### Key data flow

1. `types.ts` defines all shared interfaces (`Card`, `Faction`, `Rarity`, `Keyword`, `Deck`, `GlobalSettings`, `DerivedFaction`, etc.)
2. `data.ts` holds seed/default data and static option arrays (no logic)
3. `color-utils.ts` — pure color math; `deriveFaction(faction)` takes a `Faction` and returns a `DerivedFaction` with a full computed palette (bg gradients, accent, parchment, plate colors) derived from `faction.primary`
4. `card-preview.tsx` — the visual card renderer. Receives `card`, `keywords`, `factions`, `rarities`, and global style props; calls `deriveFaction` and `deriveRarityDeep/Glow` internally. Keywords in description text use `[KeywordName]` syntax and are parsed into interactive tooltip tokens
5. `controls.tsx` — `LeftPanel` (card properties: name, type, cost, stats, description) and `RightPanel` (appearance: faction, rarity, frame, art, global settings)
6. `glyphs.tsx` — inline SVG glyph components (`Glyph`, `RarityShape`, `CornerFlourish`). All valid glyph names are typed in `types.ts` as `ThematicGlyphName` and `UiGlyphName`
7. `io.ts` — pure serialization layer: `exportSnapshot`, `parseSnapshot`, `applySnapshot`. Import format is `AppSnapshot` version 3; older versions are rejected
8. `deck-utils.ts` — pure deck helpers: `generateId`, `normalizeDeck`, `normalizeDeckSettings`, `deleteCardFromDecks`, `affectedDeckNames`

### Views

`App.tsx` manages two top-level views via `AppView` discriminated union:
- `card-editor` — three-column layout (LeftPanel | stage/preview | RightPanel) with draggable resize handles
- `deck-editor` — full-width `DeckEditor` component; URL is synced to `#deck/<id>`

Modal overlays (`KeywordManager`, `FactionManager`, `RarityManager`, `Collection`, `DeckManager`) are mounted at the root and toggled with boolean show-state.

### Mobile

Breakpoint is `≤767px` (`isMobile` derived from `viewportW` state). Mobile shows a bottom tab bar (`props` / `preview` / `appearance`) and hides the three-column layout in favor of a single-column view. Card scale is auto-calculated to fit the viewport.

### Card dimensions

Natural card size is `340×488px`. Elements bleed outside this box (top 12px, left 10px, right 8px, bottom 8px). The stage wraps the card in an outer div sized to the full bleed-box so layout is correct at any zoom scale.

### PNG export

`html-to-image` captures the `cardRef` DOM node at `pixelRatio: 2`. The `@dnd-kit` packages are used for drag-to-sort in `DeckEditor` and `Collection`.
