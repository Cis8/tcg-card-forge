/**
 * export-utils.ts — shared helpers for PNG export via html-to-image.
 *
 * Safari/iOS quirks addressed here:
 *  - blob: URLs with cache-bust query parameters are invalid and fail to fetch.
 *  - Even without cache-bust, Safari may fail to draw blob: URLs inside the
 *    html-to-image SVG pipeline.  Pre-converting them to data URIs before
 *    calling toPng avoids the issue entirely.
 */

/**
 * For every <img> inside `el` whose src is a blob: URL, fetch the blob,
 * convert it to a base64 data URI, and replace the src in-place.
 *
 * Returns a cleanup function that restores each img to its original blob: URL.
 * Call it after toPng() finishes (success or failure).
 */
export async function preEmbedBlobImages(el: HTMLElement): Promise<() => void> {
  const imgs = Array.from(el.querySelectorAll<HTMLImageElement>('img'));
  const restores: Array<() => void> = [];

  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute('src') ?? '';
      if (!src.startsWith('blob:')) return;
      try {
        const resp = await fetch(src);
        const blob = await resp.blob();
        const dataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        img.src = dataUri;
        restores.push(() => { img.src = src; });
      } catch {
        // Leave as-is if the conversion fails — html-to-image will attempt the
        // blob URL itself and may still succeed in non-Safari environments.
      }
    }),
  );

  return () => restores.forEach((fn) => fn());
}
