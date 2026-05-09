import type { IImageRepository } from '../storage/IImageRepository';
import type { ImageHandle, StoredImage } from '../types';

export class ImageService {
  private objectUrlCache = new Map<string, string>();
  private pendingLoads   = new Map<string, Promise<ImageHandle | null>>();
  private blobCache      = new Map<string, Blob>(); // hint for export
  private imageRepo: IImageRepository;

  constructor(imageRepo: IImageRepository) {
    this.imageRepo = imageRepo;
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private async compressBlob(
    blob: Blob,
    maxSide: number,
    quality: number,
  ): Promise<{ blob: Blob; width: number; height: number }> {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    let canvas: HTMLCanvasElement | OffscreenCanvas;
    let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(w, h);
      ctx = canvas.getContext('2d')!;
    } else {
      canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      ctx = canvas.getContext('2d')!;
    }

    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const compressed = canvas instanceof OffscreenCanvas
      ? await canvas.convertToBlob({ type: 'image/jpeg', quality })
      : await new Promise<Blob>((res, rej) =>
          (canvas as HTMLCanvasElement).toBlob(
            b => (b ? res(b) : rej(new Error('toBlob failed'))),
            'image/jpeg',
            quality,
          )
        );

    return { blob: compressed, width: w, height: h };
  }

  private async hashBlob(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.slice(0, 40);
  }

  // ── Public API ───────────────────────────────────────────────────────────

  async storeFromFile(file: File | Blob, maxSide = 1920, quality = 0.85): Promise<ImageHandle> {
    const { blob: compressed, width, height } = await this.compressBlob(file, maxSide, quality);
    const id = await this.hashBlob(compressed);

    const existing = await this.imageRepo.getById(id);
    if (existing) {
      await this.imageRepo.incrementRef(id);
      const objectUrl = this.objectUrlCache.get(id) ?? URL.createObjectURL(existing.blob);
      this.objectUrlCache.set(id, objectUrl);
      this.blobCache.set(id, existing.blob);
      return { id, objectUrl, width: existing.width, height: existing.height };
    }

    const stored: StoredImage = {
      id,
      blob: compressed,
      mimeType: 'image/jpeg',
      width,
      height,
      refCount: 1,
    };
    await this.imageRepo.put(stored);

    const objectUrl = URL.createObjectURL(compressed);
    this.objectUrlCache.set(id, objectUrl);
    this.blobCache.set(id, compressed);

    return { id, objectUrl, width, height };
  }

  async storeFromDataUrl(dataUrl: string, maxSide = 1920, quality = 0.85): Promise<ImageHandle> {
    const blob = await fetch(dataUrl).then(r => r.blob());
    return this.storeFromFile(blob, maxSide, quality);
  }

  async resolve(artId: string | null): Promise<ImageHandle | null> {
    if (!artId) return null;

    const cachedUrl = this.objectUrlCache.get(artId);
    if (cachedUrl) {
      // We need width/height too — check blobCache and build a minimal handle
      // If blob is cached we know the record was loaded; fetch from imageRepo for dims
      const stored = await this.imageRepo.getById(artId);
      if (!stored) return null;
      return { id: artId, objectUrl: cachedUrl, width: stored.width, height: stored.height };
    }

    const pending = this.pendingLoads.get(artId);
    if (pending) return pending;

    const load = (async (): Promise<ImageHandle | null> => {
      try {
        const stored = await this.imageRepo.getById(artId);
        if (!stored) return null;

        const objectUrl = URL.createObjectURL(stored.blob);
        this.objectUrlCache.set(artId, objectUrl);
        this.blobCache.set(artId, stored.blob);

        return { id: artId, objectUrl, width: stored.width, height: stored.height };
      } finally {
        this.pendingLoads.delete(artId);
      }
    })();

    this.pendingLoads.set(artId, load);
    return load;
  }

  async preloadMany(artIds: Array<string | null>): Promise<void> {
    const unique = [...new Set(artIds.filter((id): id is string => id !== null))]
      .filter(id => !this.objectUrlCache.has(id));
    await Promise.all(unique.map(id => this.resolve(id)));
  }

  async releaseArt(artId: string): Promise<void> {
    await this.imageRepo.decrementRef(artId);
    const updated = await this.imageRepo.getById(artId);
    if (!updated || updated.refCount <= 0) {
      await this.imageRepo.delete(artId);
      const url = this.objectUrlCache.get(artId);
      if (url) URL.revokeObjectURL(url);
      this.objectUrlCache.delete(artId);
      this.blobCache.delete(artId);
    }
  }

  getCachedUrl(artId: string): string | null {
    return this.objectUrlCache.get(artId) ?? null;
  }

  getCachedBlob(artId: string): Blob | undefined {
    return this.blobCache.get(artId);
  }

  dispose(): void {
    for (const url of this.objectUrlCache.values()) {
      URL.revokeObjectURL(url);
    }
    this.objectUrlCache.clear();
    this.blobCache.clear();
  }
}
