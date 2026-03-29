'use client';

import { countCharacters } from '@/lib/coverLetter';
import {
  AccordionRoot,
  AccordionItem,
  AccordionTrigger,
  AccordionPanel,
} from '@/components/ui/accordion';

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
  return (
    <AccordionRoot>
      <AccordionItem value={id}>
        <AccordionTrigger>
          <span className="flex-1 truncate">{question}</span>
        </AccordionTrigger>
        <AccordionPanel>
          <div className="flex flex-col gap-3">
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
                className="min-h-32 w-full resize-none rounded-lg bg-muted/50 px-3 py-2 text-sm ring-1 ring-foreground/10 focus:outline-none focus:ring-primary"
                value={answer}
                onChange={(e) => onAnswerChange(id, e.target.value)}
              />
            </div>
          </div>
        </AccordionPanel>
      </AccordionItem>
    </AccordionRoot>
  );
}
