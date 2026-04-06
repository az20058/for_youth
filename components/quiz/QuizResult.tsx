"use client";

import { ExternalLink, RotateCcw } from "lucide-react";
import { FlameIcon } from "./FlameIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Recommendation } from "@/lib/quiz";

interface QuizResultProps {
  recommendations: Recommendation[];
  onReset: () => void;
}

export function QuizResult({ recommendations, onReset }: QuizResultProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10 flex flex-col flex-1">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8 text-center">
          <FlameIcon className="size-50" />
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
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-2">
                      <CardTitle>{rec.name}</CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {rec.agency}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {rec.mainCategory && (
                          <Badge variant="outline" className="text-xs">
                            #{rec.mainCategory}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          #{rec.category}
                        </Badge>
                      </div>
                    </div>
                    {rec.applicationUrl && (
                      <a
                        href={rec.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1 text-xs text-primary hover:opacity-80 transition-opacity mt-0.5"
                      >
                        신청하기
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {rec.description}
                  </p>
                  <div className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-2">
                    <p className="text-xs text-primary leading-relaxed">
                      💡 {rec.matchReason}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reset */}
        <Button
          variant="outline"
          className="w-full h-12 rounded-2xl mt-8 gap-2"
          onClick={onReset}
        >
          <RotateCcw className="size-4" />
          다시 테스트하기
        </Button>
      </div>
    </div>
  );
}
