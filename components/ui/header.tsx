'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { CircleUserRound } from 'lucide-react';
import { FlameIcon } from '@/components/icons/FlameIcon';
import { cn } from '@/lib/utils';
import { useIsApp } from '@/lib/useIsApp';
import { getNavItems, isNavActive } from '@/lib/nav';
import { NotificationBell } from '@/components/NotificationBell';

const navItems = getNavItems('global');

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'EMBER' }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isApp = useIsApp();

  if (isApp) return null;

  return (
    <header className="flex items-center gap-6 px-6 py-3 bg-background">
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <FlameIcon className="size-10" />
        <span className="text-white text-lg font-bold tracking-wide">
          {title}
        </span>
      </Link>

      <nav className="hidden md:flex items-center gap-1 flex-1">
        {navItems.map((item) => {
          const active = isNavActive(item, pathname, 'global');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        {session?.user ? (
          <>
            <NotificationBell />
            <Link href="/mypage" className="flex items-center">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt="프로필"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <CircleUserRound className="size-6 text-muted-foreground" />
              )}
            </Link>
          </>
        ) : (
          <Link href="/login" aria-label="로그인">
            <CircleUserRound className="size-6 text-muted-foreground hover:text-white transition-colors" />
          </Link>
        )}
      </div>
    </header>
  );
}
