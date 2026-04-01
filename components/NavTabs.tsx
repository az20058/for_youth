'use client';

import { useRef, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/applications', label: '지원 현황' },
  { href: '/cover-letters', label: '자기소개서' },
];

export function NavTabs() {
  const pathname = usePathname();
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
  const [animate, setAnimate] = useState(false);

  useLayoutEffect(() => {
    const activeIndex = tabs.findIndex((t) => t.href === pathname);
    if (activeIndex === -1) return;
    const el = tabRefs.current[activeIndex];
    if (!el) return;
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [pathname]);

  // 첫 렌더 이후부터만 transition 적용 (초기 위치 점프 방지)
  useLayoutEffect(() => {
    if (indicator) setAnimate(true);
  }, [indicator]);

  return (
    <nav className="relative flex border-b border-foreground/10 mb-6">
      {indicator && (
        <span
          className={cn(
            'absolute bottom-0 h-0.5 bg-primary',
            animate && 'transition-all duration-200 ease-out',
          )}
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
      {tabs.map(({ href, label }, i) => (
        <Link
          key={href}
          href={href}
          ref={(el) => {
            tabRefs.current[i] = el;
          }}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            pathname === href
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
