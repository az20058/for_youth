'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, BriefcaseIcon, CalendarIcon, UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsApp } from '@/lib/useIsApp';

const navItems = [
  { href: '/', label: '홈', icon: HomeIcon, activePaths: ['/', '/programs'] },
  { href: '/applications', label: '지원 현황', icon: BriefcaseIcon, activePaths: ['/applications', '/cover-letters'] },
  { href: '/schedule', label: '일정', icon: CalendarIcon, activePaths: ['/schedule'] },
  { href: '/mypage', label: '마이', icon: UserIcon, activePaths: ['/mypage'] },
];

export function MobileFooterNav() {
  const pathname = usePathname();
  const isApp = useIsApp();

  if (isApp) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1C1C1E] border-t border-foreground/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon, activePaths }) => {
          const isActive = activePaths.some(
            (p) => pathname === p || pathname.startsWith(p + '/'),
          );
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.92] active:bg-foreground/10 min-w-[56px]',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
