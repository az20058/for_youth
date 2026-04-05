"use client";

import { useRef, useState } from "react";
import { PlusIcon, SaveIcon } from "lucide-react";
import { toast } from "sonner";
import type { CoverLetterQA, CoverLetterType } from "@/lib/types";
import { CoverLetterAccordion } from "./CoverLetterAccordion";
import { Button } from "@/components/ui/button";

interface CoverLetterListProps {
  applicationId: string;
  initialCoverLetters: CoverLetterQA[];
}

export function CoverLetterList({
  applicationId,
  initialCoverLetters,
}: CoverLetterListProps) {
  // id + type만 state로 관리 (렌더링에 필요한 최소 데이터)
  const [items, setItems] = useState(
    initialCoverLetters.map(({ id, type }) => ({ id, type })),
  );
  const [isSaving, setIsSaving] = useState(false);

  // question/answer는 ref로 관리 (입력 중 리렌더링 없음)
  const valuesRef = useRef<
    Record<string, { question: string; answer: string }>
  >(
    Object.fromEntries(
      initialCoverLetters.map((cl) => [
        cl.id,
        { question: cl.question, answer: cl.answer },
      ]),
    ),
  );

  function handleQuestionBlur(id: string, value: string) {
    valuesRef.current[id] = { ...valuesRef.current[id], question: value };
  }

  function handleAnswerBlur(id: string, value: string) {
    valuesRef.current[id] = { ...valuesRef.current[id], answer: value };
  }

  function handleTypeChange(id: string, type: CoverLetterType | null) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, type } : item)),
    );
  }

  function handleAddCoverLetter() {
    const id = `cl-${Date.now()}`;
    valuesRef.current[id] = { question: "", answer: "" };
    setItems((prev) => [...prev, { id, type: null }]);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const coverLetters = items.map((item) => ({
        ...item,
        ...valuesRef.current[item.id],
      }));
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverLetters }),
      });
      if (!res.ok) throw new Error("저장 실패");
      toast.success("저장되었습니다.");
    } catch {
      toast.error("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 && (
        <p className="py-2 text-sm text-muted-foreground">
          자기소개서 항목이 없습니다.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const values = valuesRef.current[item.id] ?? {
            question: "",
            answer: "",
          };
          return (
            <CoverLetterAccordion
              key={item.id}
              id={item.id}
              question={values.question}
              answer={values.answer}
              type={item.type ?? null}
              onQuestionBlur={handleQuestionBlur}
              onAnswerBlur={handleAnswerBlur}
              onTypeChange={handleTypeChange}
            />
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="gap-1.5 flex-1"
          onClick={handleAddCoverLetter}
        >
          <PlusIcon />
          질문 추가
        </Button>
        <Button className="gap-1.5" onClick={handleSave} disabled={isSaving}>
          <SaveIcon className="size-4" />
          {isSaving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
