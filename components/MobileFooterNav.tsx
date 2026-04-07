'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, BriefcaseIcon, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '홈', icon: HomeIcon, exact: true },
  { href: '/applications', label: '지원 현황', icon: BriefcaseIcon, exact: false },
  { href: '/schedule', label: '일정', icon: CalendarIcon, exact: false },
];

export function MobileFooterNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1C1C1E] border-t border-foreground/10">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors',
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
