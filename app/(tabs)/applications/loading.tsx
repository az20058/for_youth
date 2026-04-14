import { Skeleton } from '@/components/ui/skeleton';

export default function ApplicationsLoading() {
  return (
    <main className="py-8">
      <div className="flex items-start justify-between mb-6">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      <Skeleton className="h-4 w-32 mb-3" />

      <div className="rounded-xl border border-foreground/10 overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-foreground/10">
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
