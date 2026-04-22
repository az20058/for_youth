import Link from 'next/link';
import { PlusIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ApplicationsLoading() {
  return (
    <main>
      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">입사 지원 현황</h1>
        <Link
          href="/applications/new"
          className="hidden md:inline-flex items-center gap-2 rounded-lg bg-primary px-4 h-9 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <PlusIcon className="size-4" />새 지원서 추가
        </Link>
      </div>

      {/* 칩 필터 스켈레톤 */}
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-16 rounded-full" />
        ))}
      </div>

      {/* 모바일 카드 스켈레톤 */}
      <div className="flex flex-col gap-2 md:hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
        ))}
      </div>

      {/* 데스크탑 테이블 스켈레톤 */}
      <div className="hidden md:block">
        <Skeleton className="h-4 w-32 mb-3" />
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-10" />
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-3.5 w-14 hidden sm:block" />
            <Skeleton className="h-3.5 w-16 ml-auto" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-foreground/5 last:border-0">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-14 hidden sm:block" />
              <Skeleton className="h-5 w-16 rounded-full ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
