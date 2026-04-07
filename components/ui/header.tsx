'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { CircleUserRound, LogOut, HomeIcon, BriefcaseIcon, CalendarIcon } from 'lucide-react';
import { FlameIcon } from '@/components/icons/FlameIcon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '홈', icon: HomeIcon, exact: true },
  { href: '/applications', label: '지원 현황', icon: BriefcaseIcon, exact: false },
  { href: '/schedule', label: '일정', icon: CalendarIcon, exact: false },
];

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'EMBER' }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <header className="flex items-center gap-6 px-6 py-3 bg-[#1C1C1E]">
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <FlameIcon className="size-10" />
        <span className="text-white text-lg font-bold tracking-wide">
          {title}
        </span>
      </Link>

      <nav className="hidden md:flex items-center gap-1 flex-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto">
        {session?.user ? (
          <div className="flex items-center gap-2">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt="프로필"
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <CircleUserRound className="size-6 text-[#9B9B9B]" />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: '/login' })}
              aria-label="로그아웃"
              className="rounded-full text-[#9B9B9B] hover:text-white hover:bg-[#3A3A3A]"
            >
              <LogOut className="size-5" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            asChild
            aria-label="로그인"
            className="rounded-full text-[#9B9B9B] hover:text-white hover:bg-[#3A3A3A]"
          >
            <Link href="/login">
              <CircleUserRound className="size-6" />
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
