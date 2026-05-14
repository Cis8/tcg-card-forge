import { useState, useRef, useEffect } from 'react';
import type { RefObject } from 'react';
import * as htmlToImage from 'html-to-image';
import type { CardWithArt, Faction } from '../types';
import { preEmbedBlobImages } from '../export-utils';

// Must match App.tsx constants
const CARD_W = 340, CARD_H = 488;
const BLEED_TOP = 12, BLEED_LEFT = 10, BLEED_RIGHT = 8, BLEED_BOTTOM = 8;

export type BatchPngExportState =
  | { kind: 'idle' }
  | { kind: 'rendering'; index: number; total: number }
  | { kind: 'zipping' }
  | { kind: 'done'; count: number }
  | { kind: 'error'; message: string };

export interface BatchPngExportOptions {
  sortByFaction: boolean;
  sortByCost: boolean;
}

interface CapturedEntry {
  card: CardWithArt;
  dataUrl: string;
}

function safeName(s: string): string {
  const clean = (s ?? '').replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '');
  return clean || 'untitled';
}

function buildFilePath(card: CardWithArt, options: BatchPngExportOptions, factions: Faction[]): string {
  const filename = `${safeName(card.name)}.png`;
  const parts: string[] = [];

  if (options.sortByFaction) {
    const faction = factions.find(f => f.id === card.faction);
    parts.push(safeName(faction?.name ?? card.faction ?? 'Unknown'));
  }

  if (options.sortByCost) {
    const cost = card.cost ?? 0;
    parts.push(cost >= 10 ? '10+' : String(cost));
  }

  parts.push(filename);
  return parts.join('/');
}

async function buildAndDownloadZip(
  entries: CapturedEntry[],
  options: BatchPngExportOptions,
  factions: Faction[],
): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  for (const { card, dataUrl } of entries) {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    zip.file(buildFilePath(card, options, factions), blob);
  }

  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.download = `cards-${new Date().toISOString().slice(0, 10)}.zip`;
  a.href = url;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function useBatchPngExport(batchRenderRef: RefObject<HTMLDivElement | null>) {
  const [state, setState] = useState<BatchPngExportState>({ kind: 'idle' });
  const [cardToRender, setCardToRender] = useState<CardWithArt | null>(null);

  const queueRef    = useRef<CardWithArt[]>([]);
  const indexRef    = useRef(0);
  const capturedRef = useRef<CapturedEntry[]>([]);
  const optionsRef  = useRef<BatchPngExportOptions>({ sortByFaction: false, sortByCost: false });
  const fontCSSRef  = useRef<string | null>(null);
  const factionsRef = useRef<Faction[]>([]);
  const cancelRef   = useRef(false);

  useEffect(() => {
    if (!cardToRender) return;

    // 100ms: enough for React to commit the new card and the browser to paint it
    const timer = setTimeout(async () => {
      if (cancelRef.current) return;
      const el = batchRenderRef.current;
      if (!el) {
        setState({ kind: 'error', message: 'Render container unavailable' });
        return;
      }

      try {
        const fontEmbedCSS = fontCSSRef.current;
        // Pre-embed blob: art images as data URIs — same Safari fix as onExportPng.
        const restoreImages = await preEmbedBlobImages(el);
        let dataUrl: string;
        try {
          dataUrl = await htmlToImage.toPng(el, {
            pixelRatio: 2,
            cacheBust: false, // true breaks blob: URL art on all browsers
            backgroundColor: undefined,
            width: CARD_W + BLEED_LEFT + BLEED_RIGHT,
            height: CARD_H + BLEED_TOP + BLEED_BOTTOM,
            style: { marginLeft: `${BLEED_LEFT}px`, marginTop: `${BLEED_TOP}px` },
            filter: (node) => !(node as Element).classList?.contains('desc-placeholder'),
            ...(fontEmbedCSS != null ? { fontEmbedCSS } : {}),
          });
        } finally {
          restoreImages();
        }

        if (cancelRef.current) return;
        capturedRef.current.push({ card: cardToRender, dataUrl });

        const nextIndex = indexRef.current + 1;
        indexRef.current = nextIndex;

        if (nextIndex >= queueRef.current.length) {
          setState({ kind: 'zipping' });
          setCardToRender(null);
          const captured = capturedRef.current.slice();
          await buildAndDownloadZip(captured, optionsRef.current, factionsRef.current);
          if (!cancelRef.current) setState({ kind: 'done', count: captured.length });
        } else {
          setState({ kind: 'rendering', index: nextIndex, total: queueRef.current.length });
          setCardToRender(queueRef.current[nextIndex]);
        }
      } catch (e) {
        if (!cancelRef.current) {
          setState({ kind: 'error', message: e instanceof Error ? e.message : String(e) });
        }
        setCardToRender(null);
      }
    }, 100);

    return () => clearTimeout(timer);
  // cardToRender and batchRenderRef are the only reactive values needed;
  // the rest are accessed via stable refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardToRender]);

  const start = (
    cards: CardWithArt[],
    options: BatchPngExportOptions,
    fontEmbedCSS: string | null,
    factions: Faction[],
  ) => {
    if (cards.length === 0) return;
    cancelRef.current   = false;
    queueRef.current    = cards;
    indexRef.current    = 0;
    capturedRef.current = [];
    optionsRef.current  = options;
    fontCSSRef.current  = fontEmbedCSS;
    factionsRef.current = factions;
    setState({ kind: 'rendering', index: 0, total: cards.length });
    setCardToRender(cards[0]);
  };

  const cancel = () => {
    cancelRef.current = true;
    setCardToRender(null);
    setState({ kind: 'idle' });
  };

  const reset = () => {
    setState({ kind: 'idle' });
    setCardToRender(null);
  };

  return { state, cardToRender, start, cancel, reset };
}
