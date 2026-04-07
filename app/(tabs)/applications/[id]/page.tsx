import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, BriefcaseIcon, BuildingIcon, CalendarIcon, CircleDotIcon, ExternalLinkIcon } from 'lucide-react';
import { prisma } from '@/lib/db';
import { STATUS_FROM_DB, SIZE_FROM_DB, COVER_LETTER_TYPE_FROM_DB } from '@/lib/enumMaps';
import { formatDeadline } from '@/lib/deadline';
import { calculateDDay, formatDDay } from '@/lib/dday';
import { Badge } from '@/components/ui/badge';
import { CoverLetterList } from './_components/CoverLetterList';
import { statusBadgeClass } from '@/lib/statusBadge';

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = await prisma.application.findUnique({
    where: { id },
    include: { coverLetters: true },
  });

  if (!raw) notFound();

  const application = {
    ...raw,
    companySize: SIZE_FROM_DB[raw.companySize],
    status: STATUS_FROM_DB[raw.status],
    url: raw.url ?? undefined,
    coverLetters: raw.coverLetters.map((cl) => ({
      id: cl.id,
      question: cl.question,
      answer: cl.answer,
      type: cl.type ? COVER_LETTER_TYPE_FROM_DB[cl.type] : null,
    })),
  };

  const dday = application.deadline ? calculateDDay(application.deadline) : null;

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
                <Badge className={statusBadgeClass(application.status)}>
                  <CircleDotIcon />
                  {application.status}
                </Badge>
              </div>
            </div>

            {/* 마감일 강조 영역 */}
            <div className="flex flex-col items-start gap-1 rounded-xl bg-muted/50 px-4 py-3 sm:items-end">
              <span className="text-xs text-muted-foreground">마감일</span>
              <span className="text-base font-semibold">
                {application.deadline ? formatDeadline(application.deadline) : '-'}
              </span>
              <span className="text-sm font-medium text-primary">
                {dday !== null ? formatDDay(dday) : ''}
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
            {application.deadline && (
              <Badge variant="outline" className="gap-1">
                <CalendarIcon className="size-3" />
                {formatDeadline(application.deadline)}
              </Badge>
            )}
            {application.url && (
              <a
                href={application.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Badge variant="outline" className="gap-1">
                  <ExternalLinkIcon className="size-3" />
                  채용 공고
                </Badge>
              </a>
            )}
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
          <CoverLetterList applicationId={id} initialCoverLetters={application.coverLetters} />
        </section>
      </div>
    </main>
  );
}
