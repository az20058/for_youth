'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FlameLoading } from '@/components/ui/flame-loading';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <FlameLoading fullscreen />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
}
