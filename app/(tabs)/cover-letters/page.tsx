import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/auth";
import { STATUS_FROM_DB, SIZE_FROM_DB, COVER_LETTER_TYPE_FROM_DB } from "@/lib/enumMaps";
import { CoverLettersList } from './_components/CoverLettersList';

export const metadata: Metadata = {
  title: "자기소개서",
  description: "작성한 자기소개서를 유형별로 모아 확인하세요.",
};

export default async function CoverLettersPage() {
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
    <main>
      <h1 className="text-2xl font-bold tracking-tight mb-6">자기소개서</h1>
      <CoverLettersList initialData={initialData} />
    </main>
  );
}
