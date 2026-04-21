"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FlameIcon } from "@/components/icons/FlameIcon";
import { ProgramCard } from "@/components/ui/program-card";
import { HeroCarousel } from "./HeroCarousel";
import { HomeContentSkeleton } from "./HomeContentSkeleton";
import type { Recommendation } from "@/lib/quiz";

async function fetchPrograms(): Promise<Recommendation[]> {
  const res = await fetch("/api/programs?page=1&limit=50");
  if (!res.ok) throw new Error("정책 목록을 불러오지 못했습니다.");
  const data = await res.json();
  return data.items ?? [];
}

export function HomeContent() {
  const { data: session } = useSession();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let parsed: Recommendation[] = [];
    try {
      const stored = localStorage.getItem("ember_recommendations");
      if (stored) parsed = JSON.parse(stored) as Recommendation[];
    } catch {}
    // SSR 안전을 위해 마운트 시 localStorage를 읽어 상태를 초기화하는 불가피한 패턴
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecommendations(parsed);
    setHydrated(true);
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
    ? [...recommendations].slice(0, 3)
    : heroPrograms;

  const userName = session?.user?.name ?? null;

  if (isLoading || !hydrated) return <HomeContentSkeleton />;

  /* ── 퀴즈 전 상태 ── */
  if (!hasPersonalized) {
    return (
      <div className="flex flex-col gap-8">
        {/* 브랜드 Hero */}
        <section className="flex flex-col items-center gap-6 py-8 text-center">
          <FlameIcon className="size-20" glow />
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold leading-tight tracking-tight">
              당신의 불씨는 <span className="text-primary">어디에?</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              나에게 맞는 청년 지원 프로그램을 찾아드려요.
              <br />
              먼저 짧은 질문에 답해보세요!
            </p>
          </div>
          <Link
            href="/quiz"
            className="flex items-center justify-between w-full max-w-sm bg-primary text-primary-foreground rounded-xl px-5 py-4 text-base font-semibold hover:bg-primary/90 transition-colors"
          >
            나에게 맞는 프로그램 찾기
            <ArrowRight className="size-5" />
          </Link>
        </section>

        {/* 다른 청년들이 보는 정책 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">다른 청년들이 보는 정책</h2>
          <div className="flex flex-col gap-3">
            {heroPrograms.map((program) => (
              <ProgramCard key={program.id ?? program.name} program={program} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  /* ── 퀴즈 후 상태 ── */
  return (
    <div className="flex flex-col gap-8">
      {/* 추천 섹션 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">
          {userName ? `${userName}님께 추천하는 3가지` : "나를 위한 추천 프로그램"}
        </h2>
        <div className="flex flex-col gap-3">
          {hotPrograms.map((program) => (
            <ProgramCard key={program.id ?? program.name} program={program} />
          ))}
        </div>
        <Link
          href="/quiz"
          className="flex items-center justify-between bg-card border border-border rounded-xl px-5 py-4 text-sm font-medium hover:bg-accent transition-colors"
        >
          다시 추천받기
          <ArrowRight className="size-4" />
        </Link>
      </section>

      {/* HOT 섹션 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">지금 HOT한 열정들</h2>
        <HeroCarousel programs={heroPrograms} />
      </section>
    </div>
  );
}
