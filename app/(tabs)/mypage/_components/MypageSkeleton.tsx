import { Skeleton } from '@/components/ui/skeleton';

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <section className="p-5 rounded-2xl bg-card border border-border">
      <Skeleton className="h-5 w-24 mb-3" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function MypageSkeleton() {
  return (
    <>
      {/* 프로필 헤더 */}
      <section className="p-5 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </section>

      {/* 희망 조건 */}
      <SectionSkeleton rows={3} />

      {/* 학력 / 경력 */}
      <SectionSkeleton rows={3} />

      {/* 기술 스택 */}
      <section className="p-5 rounded-2xl bg-card border border-border">
        <Skeleton className="h-5 w-20 mb-3" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-16 rounded-full" />
          ))}
        </div>
      </section>

      {/* 자격증 / 포트폴리오 */}
      <SectionSkeleton rows={2} />

      {/* 계정 관리 */}
      <section className="p-5 rounded-2xl bg-card border border-border">
        <Skeleton className="h-5 w-20 mb-3" />
        <Skeleton className="h-12 w-full rounded-md" />
      </section>
    </>
  );
}
