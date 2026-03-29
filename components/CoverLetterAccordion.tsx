'use client';

import { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { countCharacters } from '@/lib/coverLetter';

interface CoverLetterAccordionProps {
  id: string;
  question: string;
  answer: string;
  onQuestionChange: (id: string, value: string) => void;
  onAnswerChange: (id: string, value: string) => void;
}

export function CoverLetterAccordion({
  id,
  question,
  answer,
  onQuestionChange,
  onAnswerChange,
}: CoverLetterAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl ring-1 ring-foreground/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/40 transition-colors"
      >
        <span className="flex-1 truncate">{question}</span>
        <ChevronDownIcon
          className={cn('ml-2 size-4 shrink-0 text-muted-foreground transition-transform', {
            'rotate-180': isOpen,
          })}
        />
      </button>

      {isOpen && (
        <div className="border-t border-foreground/10 px-4 py-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">질문</label>
            <input
              className="w-full rounded-lg bg-muted/50 px-3 py-2 text-sm ring-1 ring-foreground/10 focus:outline-none focus:ring-primary"
              value={question}
              onChange={(e) => onQuestionChange(id, e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">답변</label>
              <span className="text-xs text-muted-foreground">
                {countCharacters(answer)}자
              </span>
            </div>
            <textarea
              className="w-full rounded-lg bg-muted/50 px-3 py-2 text-sm ring-1 ring-foreground/10 focus:outline-none focus:ring-primary resize-none min-h-32"
              value={answer}
              onChange={(e) => onAnswerChange(id, e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
