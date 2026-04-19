import { Skeleton } from '@/components/ui/skeleton';

export function HomeContentSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {/* 히어로 슬라이드 섹션 */}
      <section className="flex flex-col gap-3">
        <Skeleton className="h-5 w-48" />
        <div className="rounded-2xl bg-secondary p-5 flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-full mt-1" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-[52px] w-full rounded-md" />
      </section>

      {/* HOT 프로그램 섹션 */}
      <section className="flex flex-col gap-3">
        <Skeleton className="h-5 w-36" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-3 w-20" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 mt-1">
                <Skeleton className="h-3 w-full bg-primary/20" />
                <Skeleton className="h-3 w-4/5 mt-1 bg-primary/20" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
