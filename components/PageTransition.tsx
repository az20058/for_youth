'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import { useIsApp } from '@/lib/useIsApp';

const TABS = [
  { index: 0, paths: ['/', '/programs'] },
  { index: 1, paths: ['/applications', '/cover-letters'] },
  { index: 2, paths: ['/schedule'] },
  { index: 3, paths: ['/mypage'] },
];

function getTabIndex(pathname: string): number {
  for (const tab of TABS) {
    if (tab.paths.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
      return tab.index;
    }
  }
  return -1;
}

let prevPath = '';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp = useIsApp();

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    node.addEventListener('animationend', () => {
      node.classList.remove('animate-slide-from-right', 'animate-slide-from-left');
    }, { once: true });
  }, []);

  useEffect(() => {
    if (!prevPath) {
      prevPath = pathname;
      return;
    }
    if (prevPath === pathname) return;

    const prevIndex = getTabIndex(prevPath);
    const currIndex = getTabIndex(pathname);
    prevPath = pathname;

    if (prevIndex === -1 || currIndex === -1 || prevIndex === currIndex) return;

    const el = document.querySelector('[data-page-transition]') as HTMLElement | null;
    if (!el) return;

    el.classList.remove('animate-slide-from-right', 'animate-slide-from-left');
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add(currIndex > prevIndex ? 'animate-slide-from-right' : 'animate-slide-from-left');
  }, [pathname]);

  return (
    <div ref={ref} data-page-transition>
      {children}
    </div>
  );
}
