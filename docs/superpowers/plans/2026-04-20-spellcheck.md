# 자기소개서 맞춤법 검사 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 자기소개서 답변 편집 화면에 한국어 맞춤법 검사 기능을 추가한다.

**Architecture:** `hanspell` npm 패키지로 Daum 맞춤법 검사기를 Next.js API 라우트(서버사이드)에서 호출한다. 클라이언트는 하이라이트 뷰로 전환해 오류 단어 클릭 → 교정안 선택 → 일괄 적용 흐름을 제공한다.

**Tech Stack:** Next.js App Router, hanspell, shadcn/ui Popover, Jest

---

## 파일 구성

| 파일 | 작업 |
|------|------|
| `lib/coverLetter.ts` | `Typo`, `RawTypo` 타입 추가 + `calculateTypoPositions`, `applyCorrections` 유틸 추가 |
| `__tests__/applications/coverLetter.test.ts` | 위 유틸 함수 테스트 추가 |
| `app/api/speller/route.ts` | hanspell 호출 프록시 API 라우트 (신규) |
| `app/(tabs)/applications/[id]/_components/SpellerHighlightView.tsx` | 하이라이트 뷰 컴포넌트 (신규) |
| `app/(tabs)/applications/[id]/_components/CoverLetterAccordion.tsx` | 맞춤법 검사 버튼 및 모드 관리 추가 |

---

## Task 1: hanspell 설치

**Files:**
- Modify: `package.json`

- [ ] **Step 1: hanspell 설치**

```bash
npm install hanspell
```

Expected: `package.json`의 dependencies에 `"hanspell": "^0.9.7"` 추가됨

- [ ] **Step 2: 타입 선언 파일 생성**

`hanspell`에 타입 정의가 없으므로 직접 선언한다. `RawTypo`는 `lib/coverLetter.ts`에서 export한 것을 import해 사용한다.

파일 생성: `types/hanspell.d.ts`

```ts
import type { RawTypo } from '../lib/coverLetter';

declare module 'hanspell' {
  export function spellCheckByDAUM(
    sentence: string,
    timeout: number,
    check: (typos: RawTypo[]) => void,
    end: (() => void) | null,
    error: ((err: Error) => void) | null,
  ): void;

  export function spellCheckByPNU(
    sentence: string,
    timeout: number,
    check: (typos: RawTypo[]) => void,
    end: (() => void) | null,
    error: ((err: Error) => void) | null,
  ): void;
}
```

- [ ] **Step 3: 커밋**

```bash
git add package.json package-lock.json types/hanspell.d.ts
git commit -m "chore: hanspell 패키지 설치 및 타입 선언 추가"
```

---

## Task 2: 유틸 함수 및 타입 추가

**Files:**
- Modify: `lib/coverLetter.ts`

- [ ] **Step 1: 타입 및 유틸 추가**

`lib/coverLetter.ts` 전체를 아래로 교체한다:

```ts
export interface SpellingError {
  original: string;
  suggestion: string;
  startIndex: number;
  endIndex: number;
  message: string;
}

export interface Typo {
  token: string;
  suggestions: string[];
  info?: string;
  start: number;
  end: number;
}

export interface RawTypo {
  token: string;
  suggestions: string[];
  info?: string;
  type: string;
  context: string;
}

export function countCharacters(text: string): number {
  return text.length;
}

export function countCharactersWithoutSpaces(text: string): number {
  return text.replace(/\s/g, '').length;
}

export function calculateTypoPositions(text: string, rawTypos: RawTypo[]): Typo[] {
  const result: Typo[] = [];
  let searchFrom = 0;

  for (const typo of rawTypos) {
    const start = text.indexOf(typo.token, searchFrom);
    if (start === -1) continue;
    const end = start + typo.token.length;
    result.push({
      token: typo.token,
      suggestions: typo.suggestions,
      info: typo.info,
      start,
      end,
    });
    searchFrom = end;
  }

  return result;
}

export function applyCorrections(
  text: string,
  corrections: Record<number, string>,
  typos: Typo[],
): string {
  const sorted = typos
    .filter((t) => corrections[t.start] !== undefined)
    .sort((a, b) => b.start - a.start);

  let result = text;
  for (const typo of sorted) {
    result = result.slice(0, typo.start) + corrections[typo.start] + result.slice(typo.end);
  }
  return result;
}
```

---

## Task 3: 유틸 함수 테스트 작성

**Files:**
- Modify: `__tests__/applications/coverLetter.test.ts`

- [ ] **Step 1: 테스트 추가**

기존 파일 import에 `calculateTypoPositions`, `applyCorrections` 추가 후 테스트 블록을 파일 끝에 추가한다:

```ts
import {
  countCharacters,
  countCharactersWithoutSpaces,
  calculateTypoPositions,
  applyCorrections,
} from '@/lib/coverLetter';
import type { SpellingError, RawTypo } from '@/lib/coverLetter';
```

파일 끝에 추가:

```ts
describe('calculateTypoPositions', () => {
  const makeRaw = (token: string, suggestions: string[]): RawTypo => ({
    token,
    suggestions,
    type: 'spell',
    context: '',
  });

  it('단어 위치를 올바르게 계산한다', () => {
    const text = '나는 밥을 먹었다';
    const result = calculateTypoPositions(text, [makeRaw('먹었다', ['먹었다'])]);
    expect(result[0].start).toBe(6);
    expect(result[0].end).toBe(9);
  });

  it('텍스트에 없는 token은 무시한다', () => {
    const text = '안녕하세요';
    const result = calculateTypoPositions(text, [makeRaw('없는단어', ['대체'])]);
    expect(result).toHaveLength(0);
  });

  it('여러 오류를 순서대로 처리한다', () => {
    const text = '오류A 정상 오류B';
    const result = calculateTypoPositions(text, [
      makeRaw('오류A', ['정상A']),
      makeRaw('오류B', ['정상B']),
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].token).toBe('오류A');
    expect(result[1].token).toBe('오류B');
  });

  it('같은 단어가 두 번 나오면 두 번째 위치를 반환한다', () => {
    const text = '반복 반복';
    const result = calculateTypoPositions(text, [
      makeRaw('반복', ['대체1']),
      makeRaw('반복', ['대체2']),
    ]);
    expect(result[0].start).toBe(0);
    expect(result[1].start).toBe(3);
  });
});

describe('applyCorrections', () => {
  it('선택된 교정안을 텍스트에 반영한다', () => {
    const text = '어떡해 되나요';
    const typos = [{ token: '어떡해', suggestions: ['어떻게'], start: 0, end: 3 }];
    const result = applyCorrections(text, { 0: '어떻게' }, typos);
    expect(result).toBe('어떻게 되나요');
  });

  it('교정안이 없는 오류는 원문 유지한다', () => {
    const text = '어떡해 되나요';
    const typos = [{ token: '어떡해', suggestions: ['어떻게'], start: 0, end: 3 }];
    const result = applyCorrections(text, {}, typos);
    expect(result).toBe('어떡해 되나요');
  });

  it('여러 교정안을 뒤에서부터 반영해 인덱스 밀림을 방지한다', () => {
    const text = 'AA BB CC';
    const typos = [
      { token: 'AA', suggestions: ['XX'], start: 0, end: 2 },
      { token: 'BB', suggestions: ['YY'], start: 3, end: 5 },
    ];
    const result = applyCorrections(text, { 0: 'XX', 3: 'YY' }, typos);
    expect(result).toBe('XX YY CC');
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npx jest __tests__/applications/coverLetter.test.ts
```

Expected: `calculateTypoPositions`, `applyCorrections` not exported 오류

- [ ] **Step 3: 테스트 실행 — 통과 확인 (Task 2 완료 후)**

```bash
npx jest __tests__/applications/coverLetter.test.ts
```

Expected: 모든 테스트 PASS

- [ ] **Step 4: 커밋**

```bash
git add lib/coverLetter.ts __tests__/applications/coverLetter.test.ts
git commit -m "feat: Typo 타입 및 calculateTypoPositions, applyCorrections 유틸 추가"
```

---

## Task 4: API 라우트 생성

**Files:**
- Create: `app/api/speller/route.ts`

- [ ] **Step 1: API 라우트 작성**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { spellCheckByDAUM } from 'hanspell';
import type { RawTypo } from '@/lib/coverLetter';
import { calculateTypoPositions } from '@/lib/coverLetter';

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  return new Promise<NextResponse>((resolve) => {
    const collected: RawTypo[] = [];

    spellCheckByDAUM(
      text,
      6000,
      (typos: RawTypo[]) => {
        collected.push(...typos);
      },
      () => {
        const typos = calculateTypoPositions(text, collected);
        resolve(NextResponse.json({ typos }));
      },
      (err: Error) => {
        console.error('hanspell error:', err);
        resolve(NextResponse.json({ error: '맞춤법 검사 실패' }, { status: 500 }));
      },
    );
  });
}
```

- [ ] **Step 2: 동작 확인 (서버 실행 후 직접 테스트)**

개발 서버 실행 중이라면:

```bash
curl -X POST http://localhost:3000/api/speller \
  -H "Content-Type: application/json" \
  -d '{"text":"한국어 맞춤법 틀리면 어떡해 되나요"}'
```

Expected: `{"typos":[{"token":"어떡해 되나요","suggestions":["어떻게 되나요"],...}]}` 형태의 JSON

- [ ] **Step 3: 커밋**

```bash
git add app/api/speller/route.ts
git commit -m "feat: 맞춤법 검사 API 라우트 추가"
```

---

## Task 5: SpellerHighlightView 컴포넌트 생성

**Files:**
- Create: `app/(tabs)/applications/[id]/_components/SpellerHighlightView.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
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
```

- [ ] **Step 2: 커밋**

```bash
git add "app/(tabs)/applications/[id]/_components/SpellerHighlightView.tsx"
git commit -m "feat: SpellerHighlightView 컴포넌트 추가"
```

---

## Task 6: CoverLetterAccordion 수정

**Files:**
- Modify: `app/(tabs)/applications/[id]/_components/CoverLetterAccordion.tsx`

- [ ] **Step 1: 맞춤법 검사 버튼 및 모드 추가**

`CoverLetterAccordion.tsx`를 아래 내용으로 교체한다:

```tsx
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
```

**주의:** 기존 `defaultValue` → `value`로 변경해 `currentAnswer` 상태와 동기화한다.

- [ ] **Step 2: ESLint + TypeScript 확인**

```bash
npx eslint "app/(tabs)/applications/[id]/_components/CoverLetterAccordion.tsx" "app/(tabs)/applications/[id]/_components/SpellerHighlightView.tsx" "app/api/speller/route.ts" "lib/coverLetter.ts"
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 전체 테스트 실행**

```bash
npx jest
```

Expected: 모든 테스트 PASS

- [ ] **Step 4: 커밋**

```bash
git add "app/(tabs)/applications/[id]/_components/CoverLetterAccordion.tsx"
git commit -m "feat: 자기소개서 맞춤법 검사 기능 추가"
```

---

## Task 7: 최종 push

- [ ] **Step 1: push**

```bash
git push origin master
```
