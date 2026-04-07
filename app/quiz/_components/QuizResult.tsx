"use client";

import Link from "next/link";
import { HomeIcon } from "lucide-react";
import { FlameIcon } from "../../../components/icons/FlameIcon";
import { Button } from "@/components/ui/button";
import { ProgramCard } from "@/components/ui/program-card";
import type { Recommendation } from "@/lib/quiz";

interface QuizResultProps {
  recommendations: Recommendation[];
}

export function QuizResult({ recommendations }: QuizResultProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10 flex flex-col flex-1">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8 text-center">
          <FlameIcon className="size-20" glow />
          <h1 className="text-2xl font-bold">맞춤 프로그램 추천 결과</h1>
          <p className="text-sm text-muted-foreground">
            AI가 분석한 나에게 딱 맞는 청년 지원 프로그램이에요.
          </p>
        </div>

        {/* Results */}
        {recommendations.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="text-muted-foreground text-sm">
              추천 결과를 가져오지 못했어요.
              <br />
              다시 시도해보세요.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 flex-1">
            {recommendations.map((rec, i) => (
              <ProgramCard key={i} program={rec} />
            ))}
          </div>
        )}

        {/* Home */}
        <Button
          variant="outline"
          className="w-full h-12 rounded-2xl mt-8 gap-2"
          asChild
        >
          <Link href="/">
            <HomeIcon className="size-4" />
            메인페이지로 이동
          </Link>
        </Button>
      </div>
    </div>
  );
}
