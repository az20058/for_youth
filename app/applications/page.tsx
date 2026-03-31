import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { getApplications } from "@/lib/applications";
import { ApplicationsTable } from "@/components/ApplicationsTable";

export default function ApplicationsPage() {
  const apps = getApplications();

  return (
    <main className="py-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">입사 지원 현황</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            총 {apps.length}개의 지원서
          </p>
        </div>
        <Link
          href="/applications/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 h-9 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          <PlusIcon className="size-4" />새 지원서 추가
        </Link>
      </div>

      <div className="mt-6">
        <ApplicationsTable applications={apps} />
      </div>
    </main>
  );
}
