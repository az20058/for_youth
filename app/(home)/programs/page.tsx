import type { Metadata } from "next";
import { ProgramsList } from "./_components/ProgramsList";

export const metadata: Metadata = {
  title: "정책 둘러보기",
  description:
    "청년 취업·창업·주거를 위한 정부 지원 정책과 프로그램을 찾아보세요.",
  alternates: {
    canonical: "https://for-youth.site/programs",
  },
};

export default function ProgramsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-white font-bold text-base">정책 둘러보기</h1>
      </div>
      <ProgramsList />
    </div>
  );
}
