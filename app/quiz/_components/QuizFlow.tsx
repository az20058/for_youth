"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ChevronLeft } from "lucide-react";
import { FlameIcon } from "../../../components/icons/FlameIcon";
import { FlameLoading } from "@/components/ui/flame-loading";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  QUIZ_QUESTIONS,
  type QuizAnswers,
  type Recommendation,
} from "@/lib/quiz";
import { isAnswered, toggleMultiChoice } from "@/lib/quizUtils";
import { QuizResult } from "./QuizResult";

type Step = "landing" | number | "loading" | "result";

export function QuizFlow() {
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>("landing");
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [result, setResult] = useState<Recommendation[]>([]);

  const currentIndex = typeof step === "number" ? step : -1;
  const currentQuestion =
    currentIndex >= 0 ? QUIZ_QUESTIONS[currentIndex] : null;
  const totalSteps = QUIZ_QUESTIONS.length;

  function handleStart() {
    setStep(0);
  }

  function handleBack() {
    if (typeof step === "number") {
      if (step === 0) setStep("landing");
      else setStep(step - 1);
    }
  }

  function handleNext() {
    if (typeof step === "number") {
      if (step < totalSteps - 1) {
        setStep(step + 1);
      } else {
        handleSubmit();
      }
    }
  }

  function handleSkip() {
    if (typeof step === "number") {
      const q = QUIZ_QUESTIONS[step];
      setAnswers((prev) => ({ ...prev, [q.id]: null }));
      handleNext();
    }
  }

  function setAnswer(id: string, value: QuizAnswers[string]) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handleMultiChoice(id: string, value: string) {
    const current = (answers[id] as string[] | undefined) ?? [];
    const next = toggleMultiChoice(current, value);
    setAnswer(id, next.length > 0 ? next : ([] as never));
  }

  async function handleSubmit() {
    setStep("loading");
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error("추천 실패");
      const data = await res.json();
      setResult(data.recommendations);
      localStorage.setItem(
        "ember_recommendations",
        JSON.stringify(data.recommendations),
      );

      if (session?.user) {
        fetch("/api/quiz/result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers, recommendations: data.recommendations }),
        }).catch(() => null);
      }

      setStep("result");
    } catch {
      setStep("result");
    }
  }

  const canProceed = currentQuestion
    ? isAnswered(currentQuestion, answers[currentQuestion.id])
    : false;

  /* ── Landing ── */
  if (step === "landing") {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 flex min-h-screen flex-col items-center justify-between pb-12">
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center max-w-sm w-full">
            <FlameIcon className="size-20" glow />
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl font-bold leading-tight tracking-tight">
                나의 열정에 <span className="text-primary">불</span>을 불여줄
                <br />
                <span className="text-primary">맞춤형 프로그램</span> 찾기
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                여러분의 관심사와 현재 상황을 파악해
                <br />
                딱 맞는 청년 지원 프로그램을 추천해드려요.
                <br />
                솔직하게 답해 주세요!
              </p>
            </div>
          </div>
          <Button
            className="w-full max-w-sm h-14 text-base rounded-2xl"
            onClick={handleStart}
          >
            테스트 시작하기
          </Button>
        </div>
      </div>
    );
  }

  /* ── Loading ── */
  if (step === "loading") {
    return (
      <FlameLoading
        fullscreen
        message="딱 맞는 프로그램을 찾는 중…"
        subMessage="AI가 분석하고 있어요. 잠시만 기다려주세요."
      />
    );
  }

  /* ── Result ── */
  if (step === "result") {
    return <QuizResult recommendations={result} />;
  }

  /* ── Questions ── */
  if (!currentQuestion) return null;
  const answer = answers[currentQuestion.id];

  return (
    <div className="h-dvh bg-background overflow-hidden">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 flex h-full flex-col py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="이전"
            className="rounded-full"
          >
            <ChevronLeft className="size-5" />
          </Button>

          {/* Progress dots */}
          <div className="flex gap-1.5">
            {QUIZ_QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all",
                  i === currentIndex
                    ? "w-4 h-2 bg-primary"
                    : i < currentIndex
                      ? "w-2 h-2 bg-primary/50"
                      : "w-2 h-2 bg-muted",
                )}
              />
            ))}
          </div>

          <div className="size-9" />
        </div>

        {/* Question */}
        <div className="flex flex-col items-center gap-4 my-6">
          <FlameIcon className="size-20" glow />
          <h2 className="text-xl font-bold text-center leading-snug">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Answer area */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 p-0.5">
          {currentQuestion.type === "multi-choice" &&
            currentQuestion.options?.map((opt) => {
              const selected = (answer as string[] | undefined)?.includes(
                opt.value,
              );
              return (
                <Button
                  key={opt.value}
                  variant="outline"
                  onClick={() =>
                    handleMultiChoice(currentQuestion.id, opt.value)
                  }
                  className={cn(
                    "w-full justify-start h-auto px-4 py-4 text-sm rounded-xl",
                    selected &&
                      "bg-primary/20 border-primary ring-1 ring-primary",
                  )}
                >
                  {opt.label}
                </Button>
              );
            })}

          {currentQuestion.type === "single-choice" &&
            currentQuestion.options?.map((opt) => {
              const selected = answer === opt.value;
              return (
                <Button
                  key={opt.value}
                  variant="outline"
                  onClick={() => setAnswer(currentQuestion.id, opt.value)}
                  className={cn(
                    "w-full justify-start h-auto px-4 py-4 text-sm rounded-xl",
                    selected &&
                      "bg-primary/20 border-primary ring-1 ring-primary",
                  )}
                >
                  {opt.label}
                </Button>
              );
            })}

          {currentQuestion.type === "select" && (
            <Select
              value={(answer as string) ?? ""}
              onValueChange={(v) => setAnswer(currentQuestion.id, v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="지역을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {currentQuestion.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {currentQuestion.type === "number" && (
            <input
              type="number"
              min={15}
              max={39}
              value={(answer as number) ?? ""}
              onChange={(e) =>
                setAnswer(
                  currentQuestion.id,
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              placeholder={currentQuestion.placeholder}
              className="w-full h-14 rounded-xl bg-muted px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          )}

          {currentQuestion.type === "textarea" && (
            <textarea
              value={(answer as string) ?? ""}
              onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
              placeholder={currentQuestion.placeholder}
              rows={5}
              className="w-full rounded-xl bg-muted px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 mt-8">
          {currentQuestion.skippable && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-sm text-muted-foreground"
            >
              잘 모르겠어요
            </Button>
          )}
          <Button
            className="w-full h-14 text-base rounded-2xl"
            onClick={handleNext}
            disabled={!canProceed}
          >
            {currentIndex === totalSteps - 1 ? "추천받기" : "다음"}
          </Button>
        </div>
      </div>
    </div>
  );
}
