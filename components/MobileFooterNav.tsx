'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, BriefcaseIcon, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '홈', icon: HomeIcon, activePaths: ['/', '/programs'] },
  { href: '/applications', label: '지원 현황', icon: BriefcaseIcon, activePaths: ['/applications', '/cover-letters'] },
  { href: '/schedule', label: '일정', icon: CalendarIcon, activePaths: ['/schedule'] },
];

export function MobileFooterNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1C1C1E] border-t border-foreground/10">
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
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs font-medium transition-all active:scale-[0.92] active:bg-foreground/10',
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
