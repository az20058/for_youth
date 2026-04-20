'use client';

import { useState } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown, Trash2Icon, SpellCheck2 } from 'lucide-react';
import { toast } from 'sonner';
import { COVER_LETTER_TYPES } from '@/lib/coverLetterType';
import type { CoverLetterType } from '@/lib/types';
import type { Typo } from '@/lib/coverLetter';
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SpellerHighlightView } from './SpellerHighlightView';

interface CoverLetterAccordionProps {
  id: string;
  question: string;
  answer: string;
  type: CoverLetterType | null;
  onQuestionBlur: (id: string, value: string) => void;
  onAnswerBlur: (id: string, value: string) => void;
  onTypeChange: (id: string, type: CoverLetterType | null) => void;
  onDelete: (id: string) => void;
  defaultOpen?: boolean;
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
  defaultOpen,
}: CoverLetterAccordionProps) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [charCount, setCharCount] = useState(answer.length);
  const [currentAnswer, setCurrentAnswer] = useState(answer);
  const [mode, setMode] = useState<'edit' | 'checking' | 'highlight'>('edit');
  const [typos, setTypos] = useState<Typo[]>([]);

  async function handleSpellCheck() {
    if (!currentAnswer.trim()) return;
    setMode('checking');
    try {
      const res = await fetch('/api/speller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentAnswer }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.typos.length === 0) {
        toast.success('맞춤법 오류가 없습니다.');
        setMode('edit');
      } else {
        setTypos(data.typos);
        setMode('highlight');
      }
    } catch {
      toast.error('맞춤법 검사에 실패했습니다.');
      setMode('edit');
    }
  }

  function handleApplyCorrections(correctedText: string) {
    setCurrentAnswer(correctedText);
    setCharCount(correctedText.length);
    onAnswerBlur(id, correctedText);
    setMode('edit');
  }

  return (
    <Accordion
      type="single"
      collapsible
      value={open ? id : ''}
      onValueChange={(v) => setOpen(v === id)}
    >
      <AccordionItem value={id} className="border rounded-xl overflow-hidden">
        <AccordionPrimitive.Header className="flex items-center gap-2 px-3">
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

          <AccordionPrimitive.Trigger
            className="flex flex-1 min-w-0 items-center gap-2 py-3 text-sm font-medium transition-all [&[data-state=open]>svg]:rotate-180"
          >
            {open ? (
              <input
                className="min-w-0 flex-1 rounded-lg bg-muted/50 px-3 py-1.5 text-sm ring-1 ring-foreground/10 focus:outline-none focus:ring-primary"
                defaultValue={question}
                placeholder="질문을 입력하세요"
                onBlur={(e) => onQuestionBlur(id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            ) : (
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
          {mode === 'highlight' ? (
            <SpellerHighlightView
              text={currentAnswer}
              typos={typos}
              onApply={handleApplyCorrections}
              onCancel={() => setMode('edit')}
            />
          ) : (
            <>
              <textarea
                className="w-full resize-none rounded-lg bg-muted/50 px-3 py-2 text-sm ring-1 ring-foreground/10 focus:outline-none focus:ring-primary [field-sizing:content]"
                value={currentAnswer}
                placeholder="답변을 입력하세요"
                rows={1}
                onChange={(e) => {
                  setCurrentAnswer(e.target.value);
                  setCharCount(e.target.value.length);
                }}
                onBlur={(e) => onAnswerBlur(id, e.target.value)}
              />
              <div className="mt-1 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                  disabled={mode === 'checking' || !currentAnswer.trim()}
                  onClick={handleSpellCheck}
                >
                  <SpellCheck2 className="size-3" />
                  {mode === 'checking' ? '검사 중...' : '맞춤법 검사'}
                </Button>
                <span className="text-xs text-muted-foreground">{charCount}자</span>
              </div>
            </>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
