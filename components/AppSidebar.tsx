'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BriefcaseIcon, FileTextIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/applications', label: '지원 현황', icon: BriefcaseIcon },
  { href: '/cover-letters', label: '자기소개서', icon: FileTextIcon },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-foreground/10 min-h-screen sticky top-0">
      <div className="px-5 py-6">
        <span className="text-base font-bold tracking-tight">취업 관리</span>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              data-active={String(isActive)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
