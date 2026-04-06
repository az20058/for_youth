import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { ApplicationsTable } from "./_components/ApplicationsTable";

export default function ApplicationsPage() {
  return (
    <main className="py-8">
      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">입사 지원 현황</h1>
        <Link
          href="/applications/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 h-9 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          <PlusIcon className="size-4" />새 지원서 추가
        </Link>
      </div>
      <ApplicationsTable />
    </main>
  );
}
