import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/auth";
import { STATUS_FROM_DB, SIZE_FROM_DB, COVER_LETTER_TYPE_FROM_DB } from "@/lib/enumMaps";
import { ApplicationsTable } from "./_components/ApplicationsTable";

export const metadata: Metadata = {
  title: "입사 지원 현황",
  description: "지원한 회사와 진행 상황을 한눈에 확인하세요.",
};

export default async function ApplicationsPage() {
  const userId = await getAuthenticatedUserId();
  if (!userId) redirect("/login");

  const apps = await prisma.application.findMany({
    where: { userId, deletedAt: null },
    include: { coverLetters: true },
    orderBy: { createdAt: "desc" },
  });

  const initialData = apps.map((app) => ({
    id: app.id,
    companyName: app.companyName,
    careerLevel: app.careerLevel,
    deadline: app.deadline?.toISOString() ?? null,
    companySize: SIZE_FROM_DB[app.companySize],
    status: STATUS_FROM_DB[app.status],
    url: app.url ?? undefined,
    coverLetters: app.coverLetters.map((cl) => ({
      id: cl.id,
      question: cl.question,
      answer: cl.answer,
      type: cl.type ? COVER_LETTER_TYPE_FROM_DB[cl.type] : null,
    })),
  }));

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
      <ApplicationsTable initialData={initialData} />
    </main>
  );
}
