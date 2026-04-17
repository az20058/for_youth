import { Skeleton } from '@/components/ui/skeleton';

export default function ApplicationDetailLoading() {
  return (
    <main className="py-6">
      {/* 뒤로가기 링크 */}
      <Skeleton className="mb-6 h-4 w-28" />

      <div>
        {/* ApplicationMetaCard */}
        <div className="mb-8 rounded-2xl bg-card ring-1 ring-foreground/10 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <Skeleton className="h-8 w-40 sm:h-9 sm:w-52" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-foreground/10 pt-4">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>

        {/* CompanySummary */}
        <div className="mb-8 rounded-2xl bg-card ring-1 ring-foreground/10 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>

        {/* 자기소개서 섹션 */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3.5 w-12" />
          </div>

          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-3">
                  <Skeleton className="h-5 w-14 rounded-full shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="size-4 shrink-0 rounded" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-20 rounded-lg" />
          </div>
        </section>
      </div>
    </main>
  );
}
