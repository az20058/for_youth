import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, BriefcaseIcon, BuildingIcon, CalendarIcon, CircleDotIcon } from 'lucide-react';
import { getApplicationById } from '@/lib/applications';
import { formatDeadline } from '@/lib/deadline';
import { calculateDDay, formatDDay } from '@/lib/dday';
import { Badge } from '@/components/ui/badge';
import { CoverLetterList } from './CoverLetterList';
import type { ApplicationStatus } from '@/lib/types';

function statusBadgeVariant(status: ApplicationStatus): 'default' | 'secondary' {
  switch (status) {
    case '서류 탈락':
    case '코테 탈락':
    case '면접 탈락':
      return 'secondary';
    default:
      return 'default';
  }
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = getApplicationById(id);

  if (!application) {
    notFound();
  }

  const dday = calculateDDay(application.deadline);

  return (
    <main className="py-6">
      <Link
        href="/applications"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        지원 현황으로
      </Link>

      <div>
        {/* 기업 정보 카드 */}
        <div className="mb-8 rounded-2xl bg-card ring-1 ring-foreground/10 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold sm:text-3xl">
                {application.companyName}
              </h1>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={statusBadgeVariant(application.status)}
                  className={
                    application.status === '지원 완료'
                      ? 'bg-teal-500 text-white hover:bg-teal-500/80'
                      : ''
                  }
                >
                  <CircleDotIcon />
                  {application.status}
                </Badge>
              </div>
            </div>

            {/* 마감일 강조 영역 */}
            <div className="flex flex-col items-start gap-1 rounded-xl bg-muted/50 px-4 py-3 sm:items-end">
              <span className="text-xs text-muted-foreground">마감일</span>
              <span className="text-base font-semibold">
                {formatDeadline(application.deadline)}
              </span>
              <span className="text-sm font-medium text-primary">
                {formatDDay(dday)}
              </span>
            </div>
          </div>

          {/* 상세 뱃지 */}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-foreground/10 pt-4">
            <Badge variant="outline" className="gap-1">
              <BriefcaseIcon className="size-3" />
              {application.careerLevel}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <BuildingIcon className="size-3" />
              {application.companySize}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <CalendarIcon className="size-3" />
              {formatDeadline(application.deadline)}
            </Badge>
          </div>
        </div>

        {/* 자기소개서 섹션 */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              자기소개서
            </h2>
            <span className="text-xs text-muted-foreground">
              {application.coverLetters.length}개 항목
            </span>
          </div>
          <CoverLetterList initialCoverLetters={application.coverLetters} />
        </section>
      </div>
    </main>
  );
}
