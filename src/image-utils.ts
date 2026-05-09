import type { Card } from './types';

export async function compressImage(
  dataUrl: string,
  maxSide: number,
  quality: number,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, maxSide / Math.max(w, h));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

export async function compressSnapshotImages(
  cards: Card[],
  maxSide: number,
  quality: number,
): Promise<Card[]> {
  return Promise.all(
    cards.map(async (card) => {
      if (!card.art) return card;
      const compressed = await compressImage(card.art, maxSide, quality);
      return { ...card, art: compressed };
    }),
  );
}
