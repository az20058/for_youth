import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';
import { STATUS_FROM_DB, SIZE_FROM_DB, COVER_LETTER_TYPE_FROM_DB } from '@/lib/enumMaps';
import { CoverLetterList } from './_components/CoverLetterList';
import { CompanySummary } from './_components/CompanySummary';
import { ApplicationMetaCard } from './_components/ApplicationMetaCard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const app = await prisma.application.findUnique({
    where: { id },
    select: { companyName: true },
  });
  return { title: app ? `${app.companyName} 지원서` : '지원서 상세' };
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getAuthenticatedUserId();
  if (!userId) redirect('/login');

  const { id } = await params;
  const raw = await prisma.application.findFirst({
    where: { id, userId, deletedAt: null },
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
        <ApplicationMetaCard
          applicationId={id}
          companyName={application.companyName}
          careerLevel={application.careerLevel}
          companySize={application.companySize}
          initialStatus={application.status}
          initialDeadline={application.deadline}
          initialUrl={application.url}
        />

        {/* 기업 분석 섹션 */}
        <div className="mb-8">
          <CompanySummary applicationId={id} />
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
