import { Skeleton } from '@/components/ui/skeleton';

export function ScheduleSkeleton() {
  return (
    <>
      {/* 캘린더 영역 */}
      <div className="rounded-xl border border-border bg-card p-3 sm:p-4 mb-6">
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="size-8 rounded-md" />
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-1 sm:mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="py-1.5 flex justify-center">
              <Skeleton className="h-3 w-4" />
            </div>
          ))}
        </div>

        {/* 날짜 그리드 (5주) */}
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md bg-border/60">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-[72px] sm:min-h-[112px] bg-card p-1 sm:p-1.5">
              <Skeleton className="size-6 sm:size-7 rounded-full mx-auto sm:mx-0" />
            </div>
          ))}
        </div>
      </div>

      {/* 일정 제목 */}
      <div className="mb-3">
        <Skeleton className="h-4 w-24" />
      </div>

      {/* 이벤트 리스트 */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
          >
            <Skeleton className="mt-1.5 size-2.5 rounded-full shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-3 w-28 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
