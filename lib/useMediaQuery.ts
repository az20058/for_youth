'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);

    function handler(e: MediaQueryListEvent) {
      setMatches(e.matches);
    }

    mql.addEventListener('change', handler);
    handler({ matches: mql.matches } as MediaQueryListEvent);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
