import { Skeleton } from '@/components/ui/skeleton';

const ALL_TYPES = [
  '전체', '지원 동기', '성장 과정', '직무 역량', '성격 장단점',
  '성공 경험', '실패 경험', '팀워크 경험', '입사 후 포부', '기타',
];

export default function CoverLettersLoading() {
  return (
    <main className="py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-6">자기소개서</h1>

      {/* 타입 필터 칩 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ALL_TYPES.map((type) => (
          <span
            key={type}
            className="px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground"
          >
            {type}
          </span>
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
