import type { Metadata } from "next";
import { HomeContent } from "./_components/HomeContent";

export const metadata: Metadata = {
  description:
    "청년 취업·이직을 위한 정부 지원 프로그램을 추천받고, 지원 현황을 한눈에 관리하세요.",
  alternates: {
    canonical: "https://for-youth.site",
  },
};

export default function Home() {
  return (
    <>
      <h1 className="sr-only">Ember — 청년 취업·이직 준비 플랫폼</h1>
      <HomeContent />
    </>
  );
}
