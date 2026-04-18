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
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 h-9 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <PlusIcon className="size-4" />새 지원서 추가
        </Link>
      </div>

      <Skeleton className="h-4 w-32 mb-3" />

      <div className="rounded-xl border border-border overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-10" />
          <Skeleton className="h-3.5 w-14" />
          <Skeleton className="h-3.5 w-14 hidden sm:block" />
          <Skeleton className="h-3.5 w-16 ml-auto" />
        </div>

        {/* 테이블 행 */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3.5 border-b border-foreground/5 last:border-0"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-14 hidden sm:block" />
            <Skeleton className="h-5 w-16 rounded-full ml-auto" />
          </div>
        ))}
      </div>
    </main>
  );
}
