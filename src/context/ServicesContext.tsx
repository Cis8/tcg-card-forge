import React, { createContext, useContext, useEffect, useState } from 'react';
import { DbService } from '../storage/DbService';
import { IdbCardRepository } from '../storage/IdbCardRepository';
import { IdbImageRepository } from '../storage/IdbImageRepository';
import { IdbSettingsRepository } from '../storage/IdbSettingsRepository';
import { ImageService } from '../services/ImageService';
import { CardService } from '../services/CardService';
import { ExportService } from '../services/ExportService';
import { SettingsService } from '../services/SettingsService';
import type { ICardRepository } from '../storage/ICardRepository';
import type { IImageRepository } from '../storage/IImageRepository';
import type { ISettingsRepository } from '../storage/ISettingsRepository';
import type { Card } from '../types';

export interface Services {
  imageService: ImageService;
  cardService: CardService;
  exportService: ExportService;
  settingsService: SettingsService;
  cardRepo: ICardRepository;
  imageRepo: IImageRepository;
  settingsRepo: ISettingsRepository;
}

const ServicesContext = createContext<Services | null>(null);

// ── Migration ──────────────────────────────────────────────────────────────────

async function migrateFromLocalStorage(
  cardRepo: ICardRepository,
  settingsRepo: ISettingsRepository,
  imageService: ImageService,
): Promise<void> {
  // Cards
  try {
    const rawCards = localStorage.getItem('tcg.cards.v2');
    if (rawCards) {
      const oldCards: Array<Record<string, unknown>> = JSON.parse(rawCards);
      for (const oldCard of oldCards) {
        try {
          // Old records may have `art` (base64) but no `artId`
          const art = typeof oldCard['art'] === 'string' ? oldCard['art'] : null;
          let artId: string | null = null;

          if (art) {
            const handle = await imageService.storeFromDataUrl(art);
            artId = handle.id;
          }

          // Build a clean Card without `art`
          const { art: _art, artId: _oldArtId, ...rest } = oldCard as Record<string, unknown> & {
            art?: unknown;
            artId?: unknown;
          };
          void _art;
          void _oldArtId;

          const card: Card = { ...(rest as unknown as Card), artId };
          await cardRepo.put(card);
        } catch (err) {
          console.warn('[Migration] Failed to migrate card:', oldCard['id'], err);
        }
      }
    }
  } catch (err) {
    console.warn('[Migration] Failed to read/parse tcg.cards.v2:', err);
  }

  // Settings entities
  const settingsKeys: Array<{
    lsKey: string;
    setter: (v: unknown) => Promise<void>;
  }> = [
    { lsKey: 'tcg.factions.v2',      setter: v => settingsRepo.setFactions(v as Parameters<ISettingsRepository['setFactions']>[0]) },
    { lsKey: 'tcg.rarities.v2',      setter: v => settingsRepo.setRarities(v as Parameters<ISettingsRepository['setRarities']>[0]) },
    { lsKey: 'tcg.keywords.v2',      setter: v => settingsRepo.setKeywords(v as Parameters<ISettingsRepository['setKeywords']>[0]) },
    { lsKey: 'tcg.globalSettings.v1',setter: v => settingsRepo.setGlobalSettings(v as Parameters<ISettingsRepository['setGlobalSettings']>[0]) },
    { lsKey: 'tcg.decks.v1',         setter: v => settingsRepo.setDecks(v as Parameters<ISettingsRepository['setDecks']>[0]) },
  ];

  for (const { lsKey, setter } of settingsKeys) {
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw) await setter(JSON.parse(raw));
    } catch (err) {
      console.warn(`[Migration] Failed to migrate ${lsKey}:`, err);
    }
  }

  // Current card ID
  try {
    const rawCurrent = localStorage.getItem('tcg.current.v2');
    if (rawCurrent) {
      const currentCard: Record<string, unknown> = JSON.parse(rawCurrent);
      if (typeof currentCard['id'] === 'string') {
        await settingsRepo.setCurrentCardId(currentCard['id']);
      }
    }
  } catch (err) {
    console.warn('[Migration] Failed to migrate tcg.current.v2:', err);
  }
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function ServicesProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [services, setServices] = useState<Services | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    DbService.open()
      .then(async db => {
        const imageRepo      = new IdbImageRepository(db);
        const cardRepo       = new IdbCardRepository(db);
        const settingsRepo   = new IdbSettingsRepository(db);
        const imageService   = new ImageService(imageRepo);
        const cardService    = new CardService(cardRepo, imageService);
        const exportService  = new ExportService(imageService);
        const settingsService = new SettingsService(settingsRepo);

        // Run localStorage migration if not yet done
        if (!localStorage.getItem('tcg.migrated.v4')) {
          try {
            await migrateFromLocalStorage(cardRepo, settingsRepo, imageService);
            localStorage.setItem('tcg.migrated.v4', '1');
          } catch (err) {
            console.warn('[ServicesProvider] Migration failed (non-fatal):', err);
          }
        }

        setServices({
          imageService,
          cardService,
          exportService,
          settingsService,
          cardRepo,
          imageRepo,
          settingsRepo,
        });
      })
      .catch(err => setError(String(err)));
  }, []);

  if (error)     return <div className="app-error">Storage init failed: {error}</div>;
  if (!services) return <div className="app-loading">Initializing storage…</div>;

  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices(): Services {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error('useServices must be called inside ServicesProvider');
  return ctx;
}
