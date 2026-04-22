import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { fetchAllYouthPolicies } from "@/lib/youthApi";
import { ProgramsList } from "./_components/ProgramsList";

const getCachedPolicies = unstable_cache(
  fetchAllYouthPolicies,
  ["youth-policies"],
  { revalidate: 3600, tags: ["youth-policies"] },
);

export const metadata: Metadata = {
  title: "정책 둘러보기",
  description:
    "청년 취업·창업·주거를 위한 정부 지원 정책과 프로그램을 찾아보세요.",
  alternates: {
    canonical: "https://for-youth.site/programs",
  },
};

export default async function ProgramsPage() {
  const policies = await getCachedPolicies();
  const categories = [
    '전체',
    ...Array.from(new Set(policies.map((p) => p.mainCategory ?? '기타'))),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">정책 둘러보기</h1>
      </div>
      <ProgramsList initialPolicies={policies} initialCategories={categories} />
    </div>
  );
}
