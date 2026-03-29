'use client';

import { useState } from 'react';
import type { CoverLetterQA } from '@/lib/types';
import { CoverLetterAccordion } from '@/components/CoverLetterAccordion';

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

  if (coverLetters.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        자기소개서 항목이 없습니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {coverLetters.map((cl) => (
        <CoverLetterAccordion
          key={cl.id}
          id={cl.id}
          question={cl.question}
          answer={cl.answer}
          onQuestionChange={handleQuestionChange}
          onAnswerChange={handleAnswerChange}
        />
      ))}
    </div>
  );
}
