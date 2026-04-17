'use client';

import { useState } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown, Trash2Icon } from 'lucide-react';
import { COVER_LETTER_TYPES } from '@/lib/coverLetterType';
import type { CoverLetterType } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
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
  onQuestionBlur: (id: string, value: string) => void;
  onAnswerBlur: (id: string, value: string) => void;
  onTypeChange: (id: string, type: CoverLetterType | null) => void;
  onDelete: (id: string) => void;
}

export function CoverLetterAccordion({
  id,
  question,
  answer,
  type,
  onQuestionBlur,
  onAnswerBlur,
  onTypeChange,
  onDelete,
}: CoverLetterAccordionProps) {
  const [open, setOpen] = useState(false);
  const [charCount, setCharCount] = useState(answer.length);
  return (
    <Accordion
      type="single"
      collapsible
      value={open ? id : ''}
      onValueChange={(v) => setOpen(v === id)}
    >
      <AccordionItem value={id} className="border rounded-xl overflow-hidden">
        <AccordionPrimitive.Header className="flex items-center gap-2 px-3">
          {/* 유형: 맨 왼쪽, trigger 밖에 배치 (중첩 button 방지) */}
          {open ? (
            <Select
              value={type ?? '__none__'}
              onValueChange={(value) =>
                onTypeChange(id, value === '__none__' ? null : (value as CoverLetterType))
              }
            >
              <SelectTrigger className="w-28 shrink-0 h-8 text-xs" aria-label="유형 선택">
                <SelectValue placeholder="유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">미지정</SelectItem>
                {COVER_LETTER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            type && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                {type}
              </span>
            )
          )}

          {/* 제목 + chevron 토글 버튼 */}
          <AccordionPrimitive.Trigger
            className="flex flex-1 min-w-0 items-center gap-2 py-3 text-sm font-medium transition-all [&[data-state=open]>svg]:rotate-180"
          >
            {open ? (
              /* 펼침: 질문 input */
              <input
                className="min-w-0 flex-1 rounded-lg bg-muted/50 px-3 py-1.5 text-sm ring-1 ring-foreground/10 focus:outline-none focus:ring-primary"
                defaultValue={question}
                placeholder="질문을 입력하세요"
                onBlur={(e) => onQuestionBlur(id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            ) : (
              /* 접힘: 질문 텍스트 */
              <span className="min-w-0 flex-1 truncate text-left">
                {question || '새 질문'}
              </span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
          </AccordionPrimitive.Trigger>

          {open && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
              aria-label="질문 삭제"
              onClick={() => onDelete(id)}
            >
              <Trash2Icon className="size-4" />
            </Button>
          )}
        </AccordionPrimitive.Header>

        <AccordionContent className="px-3 pb-3 pt-1">
          <textarea
            className="w-full resize-none rounded-lg bg-muted/50 px-3 py-2 text-sm ring-1 ring-foreground/10 focus:outline-none focus:ring-primary [field-sizing:content]"
            defaultValue={answer}
            placeholder="답변을 입력하세요"
            rows={1}
            onChange={(e) => setCharCount(e.target.value.length)}
            onBlur={(e) => onAnswerBlur(id, e.target.value)}
          />
          <div className="mt-1 text-right text-xs text-muted-foreground">
            {charCount}자
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
