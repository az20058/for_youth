'use client';

import { useRef, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/applications', label: '지원 현황' },
  { href: '/cover-letters', label: '자기소개서' },
];

export function MobileHeader() {
  const pathname = usePathname();
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
  const [animate, setAnimate] = useState(false);

  useLayoutEffect(() => {
    const activeIndex = tabs.findIndex((t) => pathname.startsWith(t.href));
    if (activeIndex === -1) return;
    const el = tabRefs.current[activeIndex];
    if (!el) return;
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [pathname]);

  useLayoutEffect(() => {
    if (indicator) setAnimate(true);
  }, [indicator]);

  return (
    <header className="md:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-foreground/10">
      <div className="px-4 h-12 flex items-center">
        <span className="text-base font-bold tracking-tight">취업 관리</span>
      </div>
      <div className="relative flex border-t border-foreground/10">
        {indicator && (
          <span
            className={cn(
              'absolute bottom-0 h-0.5 bg-primary',
              animate && 'transition-all duration-200 ease-out',
            )}
            style={{ left: indicator.left, width: indicator.width }}
          />
        )}
        {tabs.map(({ href, label }, i) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              ref={(el) => { tabRefs.current[i] = el; }}
              data-active={String(isActive)}
              className={cn(
                'flex-1 text-center py-2.5 text-sm font-medium transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
