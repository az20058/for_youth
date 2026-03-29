'use client';

import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import type { CoverLetterQA, CoverLetterType } from '@/lib/types';
import { CoverLetterAccordion } from '@/components/CoverLetterAccordion';
import { Button } from '@/components/ui/button';

interface CoverLetterListProps {
  initialCoverLetters: CoverLetterQA[];
}

export function CoverLetterList({ initialCoverLetters }: CoverLetterListProps) {
  const [coverLetters, setCoverLetters] = useState(initialCoverLetters);

  function handleQuestionChange(id: string, value: string) {
    setCoverLetters((prev) =>
      prev.map((cl) => (cl.id === id ? { ...cl, question: value } : cl)),
    );
  }

  function handleAnswerChange(id: string, value: string) {
    setCoverLetters((prev) =>
      prev.map((cl) => (cl.id === id ? { ...cl, answer: value } : cl)),
    );
  }

  function handleTypeChange(id: string, type: CoverLetterType | null) {
    setCoverLetters((prev) =>
      prev.map((cl) => (cl.id === id ? { ...cl, type } : cl)),
    );
  }

  function handleAddCoverLetter() {
    const newId = `cl-${Date.now()}`;
    setCoverLetters((prev) => [
      ...prev,
      { id: newId, question: '', answer: '', type: null },
    ]);
  }

  return (
    <div className="flex flex-col gap-4">
      {coverLetters.length === 0 && (
        <p className="py-2 text-sm text-muted-foreground">
          자기소개서 항목이 없습니다.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {coverLetters.map((cl) => (
          <CoverLetterAccordion
            key={cl.id}
            id={cl.id}
            question={cl.question}
            answer={cl.answer}
            type={cl.type ?? null}
            onQuestionChange={handleQuestionChange}
            onAnswerChange={handleAnswerChange}
            onTypeChange={handleTypeChange}
          />
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full gap-1.5"
        onClick={handleAddCoverLetter}
      >
        <PlusIcon />
        질문 추가
      </Button>
    </div>
  );
}
