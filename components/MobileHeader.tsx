'use client';

import { useRef, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useIsApp } from '@/lib/useIsApp';

const tabs = [
  { href: '/applications', label: '지원 현황' },
  { href: '/cover-letters', label: '자기소개서' },
];

export function MobileHeader() {
  const pathname = usePathname();
  const isApp = useIsApp();
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const initializedRef = useRef(false);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
  const [animate, setAnimate] = useState(false);

  useLayoutEffect(() => {
    const activeIndex = tabs.findIndex((t) => pathname.startsWith(t.href));
    if (activeIndex === -1) return;
    const el = tabRefs.current[activeIndex];
    if (!el) return;
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    if (initializedRef.current) setAnimate(true);
    initializedRef.current = true;
  }, [pathname]);

  if (isApp) return null;

  return (
    <header className="md:hidden bg-[#1C1C1E] border-b border-foreground/10">
      <div className="relative flex">
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
                'flex-1 flex items-center justify-center min-h-11 text-sm font-medium transition-colors active:bg-foreground/5',
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
