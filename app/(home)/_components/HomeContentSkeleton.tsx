import { Skeleton } from '@/components/ui/skeleton';

function ProgramCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-6 pb-3 flex flex-col gap-2">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-3 w-24" />
        <div className="flex gap-1.5 mt-0.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
      <div className="px-6 pb-6 flex flex-col gap-3">
        <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
          <Skeleton className="h-3 w-full bg-primary/20" />
          <Skeleton className="h-3 w-4/5 mt-1.5 bg-primary/20" />
          <Skeleton className="h-3 w-2/3 mt-1.5 bg-primary/20" />
        </div>
      </div>
    </div>
  );
}

export function HomeContentSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {/* 브랜드 Hero */}
      <section className="flex flex-col items-center gap-6 py-8 text-center">
        <Skeleton className="size-20 rounded-full" />
        <div className="flex flex-col items-center gap-2 w-full">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-[56px] w-full max-w-sm rounded-xl" />
      </section>

      {/* 다른 청년들이 보는 정책 */}
      <section className="flex flex-col gap-3">
        <Skeleton className="h-5 w-40" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProgramCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
