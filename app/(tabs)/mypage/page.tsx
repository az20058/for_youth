'use client';

import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { CircleUserRound, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FlameLoading } from '@/components/ui/flame-loading';

export default function MyPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <FlameLoading />;
  }

  const user = session?.user;

  return (
    <div className="py-8 space-y-8">
      <h1 className="text-xl font-bold">마이페이지</h1>

      {/* 프로필 정보 */}
      <section className="flex items-center gap-4 p-6 rounded-2xl bg-card border border-border">
        {user?.image ? (
          <Image
            src={user.image}
            alt="프로필"
            width={64}
            height={64}
            className="rounded-full"
          />
        ) : (
          <CircleUserRound className="size-16 text-muted-foreground" />
        )}
        <div className="space-y-1">
          <p className="text-lg font-semibold">{user?.name ?? '사용자'}</p>
          {user?.email && (
            <p className="text-sm text-muted-foreground">{user.email}</p>
          )}
        </div>
      </section>

      {/* 계정 관리 */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">계정 관리</h2>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 text-base"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="size-5" />
          로그아웃
        </Button>
      </section>
    </div>
  );
}
