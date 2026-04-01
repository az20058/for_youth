'use client';

import { useEffect, useState } from 'react';

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const isDev = process.env.NODE_ENV === 'development';
  const [ready, setReady] = useState(!isDev);

  useEffect(() => {
    if (!isDev) return;
    import('@/mocks/browser')
      .then(({ worker }) => worker.start({ onUnhandledRequest: 'bypass' }))
      .then(() => setReady(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null;
  return <>{children}</>;
}
