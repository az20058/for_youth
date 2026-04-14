import { Skeleton } from '@/components/ui/skeleton';

export default function CoverLettersLoading() {
  return (
    <main className="py-8">
      <Skeleton className="h-8 w-28 mb-6" />

      {/* 타입 필터 칩 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-16 rounded-full" />
        ))}
      </div>

      <Skeleton className="h-4 w-12 mb-4" />

      {/* 자소서 아코디언 항목 */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </main>
  );
}
