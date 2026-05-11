---
name: Project overview
description: TCG Card Forge app architecture, key patterns, and notable features implemented
type: project
---

Single-page React + TypeScript app (Vite) for designing TCG cards. No backend — state in localStorage + IndexedDB.

**Key architecture:**
- `App.tsx` is the single source of truth (cards, current, factions, rarities, keywords, globalSettings, decks)
- Services via `src/context/ServicesContext.tsx` (DI): ImageService, CardService, ExportService, SettingsService
- State managed via `useReducer` + `appReducer` in `src/context/AppStateContext.tsx`
- Card rendering: `CardPreview` component; natural size 340×488px with bleed (top:12, left:10, right:8, bottom:8)
- PNG export: `html-to-image.toPng` capturing a DOM ref; fonts pre-embedded via `buildFontEmbedCSS()`

**Batch PNG export (implemented 2026-05-11):**
- `src/hooks/useBatchPngExport.ts` — state machine hook that renders cards one-by-one in a hidden off-screen container, captures each with html-to-image, then zips via JSZip (dynamically imported)
- `src/batch-png-export-modal.tsx` — modal UI with faction/cost grouping checkboxes and progress bar
- Entry point: "Export PNGs" button in Collection modal header → `onExportAllPng` prop
- Hidden render container: `position: fixed; left: -9999` div with `batchRenderRef` in App.tsx
- ZIP structure controlled by `sortByFaction` / `sortByCost` options; cost folder "10+" for cost ≥ 10

**Why:** User wanted bulk PNG export with optional folder organization by faction/cost.
**How to apply:** The batch export modal has z-index 60 (above collection's z-index 50).
