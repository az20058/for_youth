import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, CalendarIcon } from 'lucide-react';
import { getApplicationById } from '@/lib/applications';
import { formatDeadline } from '@/lib/deadline';
import { Badge } from '@/components/ui/badge';
import { CoverLetterList } from './CoverLetterList';

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

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/applications"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeftIcon className="size-4" />
        지원 현황으로
      </Link>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{application.companyName}</h1>
          <Badge>{application.status}</Badge>
        </div>
        <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <CalendarIcon className="size-4" />
          <span>마감일: {formatDeadline(application.deadline)}</span>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          자기소개서 ({application.coverLetters.length}개)
        </h2>
        <CoverLetterList initialCoverLetters={application.coverLetters} />
      </section>
    </main>
  );
}
