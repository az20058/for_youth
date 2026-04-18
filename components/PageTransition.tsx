'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useCallback } from 'react';

const TAB_ORDER = ['/', '/programs', '/applications', '/cover-letters', '/schedule', '/mypage'];

function getTabIndex(pathname: string): number {
  const exact = TAB_ORDER.indexOf(pathname);
  if (exact !== -1) return exact;
  for (let i = TAB_ORDER.length - 1; i >= 0; i--) {
    if (pathname.startsWith(TAB_ORDER[i] + '/')) return i;
  }
  return -1;
}

let prevPath = '';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
