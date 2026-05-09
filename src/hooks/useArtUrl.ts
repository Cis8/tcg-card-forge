import { useState, useEffect } from 'react';
import { useServices } from '../context/ServicesContext';

export function useArtUrl(artId: string | null): string | null {
  const { imageService } = useServices();
  const [url, setUrl] = useState<string | null>(() =>
    artId ? imageService.getCachedUrl(artId) : null,
  );

  useEffect(() => {
    if (!artId) {
      setUrl(null);
      return;
    }
    const cached = imageService.getCachedUrl(artId);
    if (cached) {
      setUrl(cached);
      return;
    }
    let cancelled = false;
    imageService.resolve(artId).then(handle => {
      if (!cancelled) setUrl(handle?.objectUrl ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [artId, imageService]);

  return url;
}
