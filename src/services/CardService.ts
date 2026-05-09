import type { ICardRepository } from '../storage/ICardRepository';
import { ImageService } from './ImageService';
import type { Card, CardWithArt } from '../types';

export class CardService {
  private cardRepo: ICardRepository;
  private imageService: ImageService;

  constructor(cardRepo: ICardRepository, imageService: ImageService) {
    this.cardRepo = cardRepo;
    this.imageService = imageService;
  }

  async loadAll(): Promise<CardWithArt[]> {
    const cards = await this.cardRepo.getAll();
    return Promise.all(
      cards.map(async (card): Promise<CardWithArt> => {
        const artHandle = await this.imageService.resolve(card.artId);
        return { ...card, artHandle };
      })
    );
  }

  async save(card: Card, prevArtId?: string | null): Promise<void> {
    // Release old art if it changed
    if (
      prevArtId !== undefined &&
      prevArtId !== null &&
      prevArtId !== card.artId
    ) {
      await this.imageService.releaseArt(prevArtId);
    }

    // Save the Card entity (without artHandle)
    await this.cardRepo.put(card);
  }

  async delete(id: string): Promise<void> {
    const card = await this.cardRepo.getById(id);
    if (card?.artId) {
      await this.imageService.releaseArt(card.artId);
    }
    await this.cardRepo.delete(id);
  }

  async bulkPatchFaction(deletedId: string, fallbackId: string): Promise<void> {
    const cards = await this.cardRepo.getByFaction(deletedId);
    await Promise.all(
      cards.map(card => this.cardRepo.put({ ...card, faction: fallbackId }))
    );
  }

  async bulkPatchRarity(deletedId: string, fallbackId: string): Promise<void> {
    const all = await this.cardRepo.getAll();
    const toUpdate = all.filter(c => c.rarity === deletedId);
    await Promise.all(
      toUpdate.map(card => this.cardRepo.put({ ...card, rarity: fallbackId }))
    );
  }
}
