"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProgramCard } from "@/components/ui/program-card";
import { FlameLoading } from "@/components/ui/flame-loading";
import { HeroCarousel } from "./HeroCarousel";
import type { Recommendation } from "@/lib/quiz";

async function fetchPrograms(): Promise<Recommendation[]> {
  const res = await fetch("/api/programs?page=1&limit=50");
  if (!res.ok) throw new Error("정책 목록을 불러오지 못했습니다.");
  const data = await res.json();
  return data.items ?? [];
}

export function HomeContent() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ember_recommendations");
      if (stored) setRecommendations(JSON.parse(stored) as Recommendation[]);
    } catch {}
  }, []);

  const { data: allPrograms = [], isLoading } = useQuery({
    queryKey: ["programs"],
    queryFn: fetchPrograms,
    staleTime: 5 * 60 * 1000,
  });

  const heroPrograms = useMemo(
    () =>
      [...allPrograms]
        .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
        .slice(0, 4),
    [allPrograms],
  );

  const hasPersonalized = recommendations.length > 0;
  const hotPrograms = hasPersonalized
    ? [...recommendations]
        .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
        .slice(0, 4)
    : heroPrograms;

  if (isLoading) return <FlameLoading />;

  return (
    <div className="flex flex-col gap-8">
      {/* 히어로 슬라이드 섹션 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">
          이번주 이런 도전은 어때요?
        </h2>
        <HeroCarousel programs={heroPrograms} />
        <Link
          href="/quiz"
          className="flex items-center justify-between bg-primary text-primary-foreground rounded-md px-5 py-4 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          새로운 도전을 추천받기
          <ArrowRight className="size-5" />
        </Link>
      </section>

      {/* HOT 프로그램 섹션 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">지금 HOT한 열정들</h2>
        <div className="flex flex-col gap-3">
          {hotPrograms.map((program) => (
            <ProgramCard
              key={program.id ?? program.name}
              program={program}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
