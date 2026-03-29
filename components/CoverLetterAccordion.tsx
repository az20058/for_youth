'use client';

import { countCharacters } from '@/lib/coverLetter';
import { COVER_LETTER_TYPES } from '@/lib/coverLetterType';
import type { CoverLetterType } from '@/lib/types';
import {
  AccordionRoot,
  AccordionItem,
  AccordionTrigger,
  AccordionPanel,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CoverLetterAccordionProps {
  id: string;
  question: string;
  answer: string;
  type: CoverLetterType | null;
  onQuestionChange: (id: string, value: string) => void;
  onAnswerChange: (id: string, value: string) => void;
  onTypeChange: (id: string, type: CoverLetterType | null) => void;
}

export function CoverLetterAccordion({
  id,
  question,
  answer,
  type,
  onQuestionChange,
  onAnswerChange,
  onTypeChange,
}: CoverLetterAccordionProps) {
  return (
    <AccordionRoot>
      <AccordionItem value={id}>
        <AccordionTrigger>
          <span className="flex-1 truncate">{question || '새 질문'}</span>
        </AccordionTrigger>
        <AccordionPanel>
          <div className="flex flex-col gap-4">
            {/* 타입 선택 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">유형</label>
              <Select
                value={type ?? ''}
                onValueChange={(value) =>
                  onTypeChange(id, (value as CoverLetterType) || null)
                }
              >
                <SelectTrigger className="w-full" aria-label="유형 선택">
                  <SelectValue placeholder="미지정">
                    {type ?? '미지정'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">미지정</SelectItem>
                  {COVER_LETTER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 질문 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">질문</label>
              <input
                className="w-full rounded-lg bg-muted/50 px-3 py-2 text-sm ring-1 ring-foreground/10 focus:outline-none focus:ring-primary"
                value={question}
                placeholder="질문을 입력하세요"
                onChange={(e) => onQuestionChange(id, e.target.value)}
              />
            </div>

            {/* 답변 */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">답변</label>
                <span className="text-xs text-muted-foreground">
                  {countCharacters(answer)}자
                </span>
              </div>
              <textarea
                className="min-h-32 w-full resize-none rounded-lg bg-muted/50 px-3 py-2 text-sm ring-1 ring-foreground/10 focus:outline-none focus:ring-primary"
                value={answer}
                placeholder="답변을 입력하세요"
                onChange={(e) => onAnswerChange(id, e.target.value)}
              />
            </div>
          </div>
        </AccordionPanel>
      </AccordionItem>
    </AccordionRoot>
  );
}
