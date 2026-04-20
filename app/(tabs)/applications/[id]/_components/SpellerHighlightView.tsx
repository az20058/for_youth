'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { applyCorrections } from '@/lib/coverLetter';
import type { Typo } from '@/lib/coverLetter';

interface Props {
  text: string;
  typos: Typo[];
  onApply: (correctedText: string) => void;
  onCancel: () => void;
}

export function SpellerHighlightView({ text, typos, onApply, onCancel }: Props) {
  const [corrections, setCorrections] = useState<Record<number, string>>({});

  function selectCorrection(start: number, candidate: string) {
    setCorrections((prev) => ({ ...prev, [start]: candidate }));
  }

  function handleApply() {
    onApply(applyCorrections(text, corrections, typos));
  }

  // 텍스트를 일반 구간과 오류 구간으로 분할
  const segments: { text: string; typo?: Typo }[] = [];
  let cursor = 0;

  for (const typo of typos) {
    if (typo.start > cursor) {
      segments.push({ text: text.slice(cursor, typo.start) });
    }
    segments.push({ text: text.slice(typo.start, typo.end), typo });
    cursor = typo.end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full rounded-lg bg-muted/50 px-3 py-2 text-sm ring-1 ring-foreground/10 whitespace-pre-wrap leading-relaxed">
        {segments.map((seg, i) => {
          if (!seg.typo) {
            return <span key={i}>{seg.text}</span>;
          }
          const { typo } = seg;
          const selected = corrections[typo.start];
          return (
            <Popover key={i}>
              <PopoverTrigger asChild>
                <span
                  className={
                    selected
                      ? 'cursor-pointer rounded bg-green-100 px-0.5 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                      : 'cursor-pointer rounded bg-yellow-100 px-0.5 text-yellow-800 underline decoration-wavy dark:bg-yellow-900/40 dark:text-yellow-300'
                  }
                >
                  {selected ?? seg.text}
                </span>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3">
                {typo.info && (
                  <p className="mb-2 text-xs text-muted-foreground">{typo.info}</p>
                )}
                <p className="mb-2 text-xs font-medium">교정안 선택</p>
                <div className="flex flex-col gap-1">
                  {typo.suggestions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => selectCorrection(typo.start, c)}
                      className={`rounded px-2 py-1 text-left text-sm transition-colors hover:bg-muted ${
                        selected === c ? 'bg-primary/10 font-medium text-primary' : ''
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          취소
        </Button>
        <Button size="sm" onClick={handleApply}>
          적용
        </Button>
      </div>
    </div>
  );
}
