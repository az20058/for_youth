'use client';

import { useRef, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useIsApp } from '@/lib/useIsApp';
import type { NavItem } from '@/lib/nav';
import { isNavActive } from '@/lib/nav';

interface SegmentedTabsProps {
  items: NavItem[];
}

export function SegmentedTabs({ items }: SegmentedTabsProps) {
  const pathname = usePathname();
  const isApp = useIsApp();
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const initializedRef = useRef(false);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
  const [animate, setAnimate] = useState(false);

  useLayoutEffect(() => {
    const activeIndex = items.findIndex((item) => isNavActive(item, pathname));
    if (activeIndex === -1) return;
    const el = tabRefs.current[activeIndex];
    if (!el) return;
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    if (initializedRef.current) setAnimate(true);
    initializedRef.current = true;
  }, [pathname, items]);

  if (isApp) return null;

  return (
    <header className="md:hidden bg-background border-b border-border">
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
        {items.map((item, i) => {
          const active = isNavActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              ref={(el) => { tabRefs.current[i] = el; }}
              data-active={String(active)}
              className={cn(
                'flex-1 flex items-center justify-center min-h-11 text-sm font-medium transition-colors active:bg-foreground/5',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
