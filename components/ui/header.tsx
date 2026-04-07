'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { CircleUserRound, LogOut } from 'lucide-react';
import { FlameIcon } from '@/components/icons/FlameIcon';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'EMBER' }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-[#1C1C1E]">
      <Link href="/" className="flex items-center gap-2">
        <FlameIcon className="size-10" />
        <span className="text-white text-lg font-bold tracking-wide">
          {title}
        </span>
      </Link>
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
    </header>
  );
}
