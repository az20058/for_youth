import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { NewApplicationForm } from './_components/NewApplicationForm';

export default function NewApplicationPage() {
  return (
    <main className="py-6">
      <Link
        href="/applications"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        지원 현황으로
      </Link>

      <h1 className="mb-6 text-2xl font-semibold">새 지원서 추가</h1>

      <NewApplicationForm />
    </main>
  );
}
