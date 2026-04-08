# 기업 분석 AI 요약 기능 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 지원서 상세 페이지에서 "AI로 기업 분석하기" 버튼을 클릭하면 나무위키 + 구글 뉴스를 크롤링해 Claude Haiku로 기업 정보를 요약하고 DB에 캐싱하여 보여준다.

**Architecture:** 버튼 클릭 → `POST /api/applications/[id]/company-summary` → 24시간 캐시 확인 → 캐시 미스 시 크롤링 + Claude Haiku 요약 → DB upsert → 응답. UI는 Client Component로 버튼/로딩/결과 상태를 관리한다.

**Tech Stack:** Next.js App Router, Prisma (Neon), `@anthropic-ai/sdk`, `date-fns`, Tailwind CSS

---

## File Map

| 파일 | 작업 |
|------|------|
| `prisma/schema.prisma` | `CompanySummary` 모델 추가, `Application`에 relation 추가 |
| `prisma/migrations/…` | `npx prisma migrate dev`로 자동 생성 |
| `lib/crawl.ts` | 나무위키 raw + 구글 뉴스 RSS 크롤링 |
| `lib/companySummary.ts` | Claude Haiku API 호출 및 JSON 파싱 |
| `app/api/applications/[id]/company-summary/route.ts` | POST handler — 인증, 캐시, 크롤링, 저장 |
| `app/(tabs)/applications/[id]/_components/CompanySummary.tsx` | 버튼/로딩/결과 UI |
| `app/(tabs)/applications/[id]/page.tsx` | CompanySummary 컴포넌트 삽입 |
| `__tests__/crawl.test.ts` | fetchNamuWiki, fetchGoogleNews 단위 테스트 |
| `__tests__/companySummary.test.ts` | summarizeCompany 단위 테스트 |

---

## Task 1: Anthropic SDK 설치 및 환경변수 추가

**Files:**
- Modify: `package.json` (npm install)
- Modify: `.env` (ANTHROPIC_API_KEY 추가)

- [ ] **Step 1: SDK 설치**

```bash
npm install @anthropic-ai/sdk
```

Expected: `@anthropic-ai/sdk` added to `package.json` dependencies.

- [ ] **Step 2: .env에 키 추가**

`.env` 파일에 아래 줄을 추가한다 (실제 키 값은 Anthropic Console에서 발급):

```
ANTHROPIC_API_KEY=sk-ant-...
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: @anthropic-ai/sdk 추가"
```

---

## Task 2: DB 스키마 추가 및 마이그레이션

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: schema.prisma에 CompanySummary 모델 추가**

`prisma/schema.prisma`의 `model YouthPolicy { … }` 아래에 추가:

```prisma
model CompanySummary {
  id              String      @id @default(cuid())
  applicationId   String      @unique
  application     Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  overview        String      @db.Text
  mainBusiness    String      @db.Text
  recentNews      String      @db.Text
  motivationHints String      @db.Text
  crawledAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}
```

- [ ] **Step 2: Application 모델에 relation 추가**

`model Application { … }` 안의 `coverLetters CoverLetter[]` 아래에 추가:

```prisma
companySummary CompanySummary?
```

- [ ] **Step 3: 마이그레이션 실행**

```bash
npx prisma migrate dev --name add_company_summary
```

Expected: `prisma/migrations/…_add_company_summary/migration.sql` 생성, 성공 메시지 출력.

- [ ] **Step 4: Prisma client 재생성 확인**

마이그레이션 완료 시 자동으로 client가 재생성된다. 아래로 확인:

```bash
npx prisma generate
```

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: CompanySummary 모델 추가"
```

---

## Task 3: 크롤링 유틸 작성 (TDD)

**Files:**
- Create: `lib/crawl.ts`
- Create: `__tests__/crawl.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/crawl.test.ts`:

```typescript
import { fetchNamuWiki, fetchGoogleNews } from '@/lib/crawl';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => mockFetch.mockReset());

describe('fetchNamuWiki', () => {
  it('성공 시 텍스트를 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '카카오는 IT 기업입니다.' });
    expect(await fetchNamuWiki('카카오')).toBe('카카오는 IT 기업입니다.');
  });

  it('404 응답 시 null을 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    expect(await fetchNamuWiki('존재하지않는회사')).toBeNull();
  });

  it('네트워크 오류 시 null을 반환한다', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    expect(await fetchNamuWiki('카카오')).toBeNull();
  });

  it('3000자를 초과하는 텍스트는 잘라낸다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => 'a'.repeat(5000) });
    const result = await fetchNamuWiki('카카오');
    expect(result?.length).toBe(3000);
  });
});

describe('fetchGoogleNews', () => {
  it('RSS의 CDATA 타이틀을 파싱한다', async () => {
    const xml = `<?xml version="1.0"?><rss><channel>
      <title><![CDATA[Google 뉴스]]></title>
      <item><title><![CDATA[카카오 AI 투자 확대]]></title></item>
      <item><title><![CDATA[카카오뱅크 흑자 전환]]></title></item>
    </channel></rss>`;
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => xml });
    expect(await fetchGoogleNews('카카오')).toEqual(['카카오 AI 투자 확대', '카카오뱅크 흑자 전환']);
  });

  it('"Google 뉴스" 제목은 필터링한다', async () => {
    const xml = `<rss><channel>
      <title><![CDATA[Google 뉴스]]></title>
    </channel></rss>`;
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => xml });
    expect(await fetchGoogleNews('카카오')).toEqual([]);
  });

  it('네트워크 오류 시 빈 배열을 반환한다', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    expect(await fetchGoogleNews('카카오')).toEqual([]);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npx jest __tests__/crawl.test.ts --no-coverage
```

Expected: FAIL with "Cannot find module '@/lib/crawl'"

- [ ] **Step 3: lib/crawl.ts 구현**

`lib/crawl.ts`:

```typescript
export interface CrawlResult {
  namuWiki: string | null;
  newsHeadlines: string[];
}

export async function fetchNamuWiki(companyName: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://namu.wiki/raw/${encodeURIComponent(companyName)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const text = await res.text();
    return text.slice(0, 3000);
  } catch {
    return null;
  }
}

export async function fetchGoogleNews(companyName: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://news.google.com/rss/search?q=${encodeURIComponent(companyName)}&hl=ko&gl=KR`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];
    const xml = await res.text();
    return [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)]
      .map((m) => m[1])
      .filter((t) => !t.includes('Google 뉴스'))
      .slice(0, 10);
  } catch {
    return [];
  }
}

export async function crawlCompanyInfo(companyName: string): Promise<CrawlResult> {
  const [namuWiki, newsHeadlines] = await Promise.all([
    fetchNamuWiki(companyName),
    fetchGoogleNews(companyName),
  ]);
  return { namuWiki, newsHeadlines };
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npx jest __tests__/crawl.test.ts --no-coverage
```

Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/crawl.ts __tests__/crawl.test.ts
git commit -m "feat: 나무위키 + 구글 뉴스 크롤링 유틸 추가"
```

---

## Task 4: Claude 요약 서비스 작성 (TDD)

**Files:**
- Create: `lib/companySummary.ts`
- Create: `__tests__/companySummary.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`__tests__/companySummary.test.ts`:

```typescript
import { summarizeCompany } from '@/lib/companySummary';

const mockCreate = jest.fn();

jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

beforeEach(() => mockCreate.mockReset());

describe('summarizeCompany', () => {
  const crawlResult = {
    namuWiki: '카카오는 대한민국의 IT 기업입니다.',
    newsHeadlines: ['카카오 AI 투자 확대', '카카오뱅크 흑자'],
  };

  it('Claude 응답에서 JSON을 파싱하여 반환한다', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{
        type: 'text',
        text: JSON.stringify({
          overview: '카카오는 국내 최대 모바일 플랫폼 기업입니다.',
          mainBusiness: ['카카오톡', '카카오페이'],
          recentNews: ['AI 서비스 강화'],
          motivationHints: ['모바일 혁신 선도'],
        }),
      }],
    });

    const result = await summarizeCompany('카카오', crawlResult);

    expect(result.overview).toBe('카카오는 국내 최대 모바일 플랫폼 기업입니다.');
    expect(result.mainBusiness).toEqual(['카카오톡', '카카오페이']);
    expect(result.recentNews).toEqual(['AI 서비스 강화']);
    expect(result.motivationHints).toEqual(['모바일 혁신 선도']);
  });

  it('응답에 JSON이 없으면 에러를 던진다', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: '죄송합니다, 정보를 찾을 수 없습니다.' }],
    });

    await expect(summarizeCompany('카카오', crawlResult)).rejects.toThrow('AI 응답 파싱 실패');
  });

  it('namuWiki가 null이어도 뉴스만으로 요약 요청한다', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{
        type: 'text',
        text: JSON.stringify({
          overview: '요약',
          mainBusiness: ['사업'],
          recentNews: ['이슈'],
          motivationHints: ['포인트'],
        }),
      }],
    });

    await summarizeCompany('카카오', { namuWiki: null, newsHeadlines: ['뉴스'] });

    const prompt = mockCreate.mock.calls[0][0].messages[0].content as string;
    expect(prompt).not.toContain('[나무위키 원문]');
    expect(prompt).toContain('[최근 뉴스]');
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npx jest __tests__/companySummary.test.ts --no-coverage
```

Expected: FAIL with "Cannot find module '@/lib/companySummary'"

- [ ] **Step 3: lib/companySummary.ts 구현**

`lib/companySummary.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import type { CrawlResult } from './crawl';

export interface CompanySummaryData {
  overview: string;
  mainBusiness: string[];
  recentNews: string[];
  motivationHints: string[];
}

export async function summarizeCompany(
  companyName: string,
  crawlResult: CrawlResult,
): Promise<CompanySummaryData> {
  const client = new Anthropic();

  const namuSection = crawlResult.namuWiki
    ? `[나무위키 원문]\n${crawlResult.namuWiki}`
    : '';
  const newsSection =
    crawlResult.newsHeadlines.length > 0
      ? `[최근 뉴스]\n${crawlResult.newsHeadlines.join('\n')}`
      : '';

  const prompt = `다음은 ${companyName}에 대한 정보입니다.

${namuSection}

${newsSection}

위 내용을 바탕으로 취업 준비생이 지원 동기를 작성할 수 있도록 아래 항목을 JSON 형식으로 한국어로 답해주세요. 반드시 아래 형식의 JSON만 출력하세요:
{
  "overview": "기업 개요 (2-3문장)",
  "mainBusiness": ["핵심 사업 영역 1", "핵심 사업 영역 2"],
  "recentNews": ["최근 이슈 1", "최근 이슈 2"],
  "motivationHints": ["지원 동기 포인트 1", "지원 동기 포인트 2"]
}`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI 응답 파싱 실패');

  return JSON.parse(jsonMatch[0]) as CompanySummaryData;
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npx jest __tests__/companySummary.test.ts --no-coverage
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/companySummary.ts __tests__/companySummary.test.ts
git commit -m "feat: Claude Haiku 기업 요약 서비스 추가"
```

---

## Task 5: API Route 구현

**Files:**
- Create: `app/api/applications/[id]/company-summary/route.ts`

- [ ] **Step 1: route.ts 작성**

`app/api/applications/[id]/company-summary/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';
import { crawlCompanyInfo } from '@/lib/crawl';
import { summarizeCompany } from '@/lib/companySummary';

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ message: '인증이 필요합니다.' }, { status: 401 });

  const { id } = await params;

  const application = await prisma.application.findFirst({
    where: { id, userId },
    select: { companyName: true },
  });
  if (!application) return NextResponse.json({ message: '지원서를 찾을 수 없습니다.' }, { status: 404 });

  const existing = await prisma.companySummary.findUnique({ where: { applicationId: id } });
  if (existing && Date.now() - existing.crawledAt.getTime() < CACHE_DURATION_MS) {
    return NextResponse.json({
      overview: existing.overview,
      mainBusiness: JSON.parse(existing.mainBusiness) as string[],
      recentNews: JSON.parse(existing.recentNews) as string[],
      motivationHints: JSON.parse(existing.motivationHints) as string[],
      crawledAt: existing.crawledAt.toISOString(),
    });
  }

  const crawlResult = await crawlCompanyInfo(application.companyName);
  if (!crawlResult.namuWiki && crawlResult.newsHeadlines.length === 0) {
    return NextResponse.json({ message: '기업 정보를 찾을 수 없습니다.' }, { status: 500 });
  }

  const summary = await summarizeCompany(application.companyName, crawlResult);

  const saved = await prisma.companySummary.upsert({
    where: { applicationId: id },
    create: {
      applicationId: id,
      overview: summary.overview,
      mainBusiness: JSON.stringify(summary.mainBusiness),
      recentNews: JSON.stringify(summary.recentNews),
      motivationHints: JSON.stringify(summary.motivationHints),
    },
    update: {
      overview: summary.overview,
      mainBusiness: JSON.stringify(summary.mainBusiness),
      recentNews: JSON.stringify(summary.recentNews),
      motivationHints: JSON.stringify(summary.motivationHints),
      crawledAt: new Date(),
    },
  });

  return NextResponse.json({
    overview: saved.overview,
    mainBusiness: JSON.parse(saved.mainBusiness) as string[],
    recentNews: JSON.parse(saved.recentNews) as string[],
    motivationHints: JSON.parse(saved.motivationHints) as string[],
    crawledAt: saved.crawledAt.toISOString(),
  });
}
```

- [ ] **Step 2: 타입 에러 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add app/api/applications/[id]/company-summary/route.ts
git commit -m "feat: 기업 분석 API Route 추가"
```

---

## Task 6: UI 컴포넌트 작성

**Files:**
- Create: `app/(tabs)/applications/[id]/_components/CompanySummary.tsx`
- Modify: `app/(tabs)/applications/[id]/page.tsx`

- [ ] **Step 1: CompanySummary.tsx 작성**

`app/(tabs)/applications/[id]/_components/CompanySummary.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { SparklesIcon, RefreshCwIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlameLoading } from '@/components/ui/flame-loading';

interface CompanySummaryData {
  overview: string;
  mainBusiness: string[];
  recentNews: string[];
  motivationHints: string[];
  crawledAt: string;
}

export function CompanySummary({ applicationId }: { applicationId: string }) {
  const [data, setData] = useState<CompanySummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function analyze() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/applications/${applicationId}/company-summary`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error();
      setData(await res.json() as CompanySummaryData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl bg-card ring-1 ring-foreground/10 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold flex items-center gap-1.5">
          <SparklesIcon className="size-4 text-primary" />
          기업 분석
        </h2>
        {data && !loading && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(data.crawledAt), { addSuffix: true, locale: ko })}
            </span>
            <Button variant="ghost" size="icon" className="size-7" onClick={analyze} aria-label="새로고침">
              <RefreshCwIcon className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {!data && !loading && !error && (
        <Button onClick={analyze} variant="outline" className="w-full gap-2">
          <SparklesIcon className="size-4" />
          AI로 기업 분석하기
        </Button>
      )}

      {loading && <FlameLoading message="기업 정보를 분석하는 중…" />}

      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-4">
          <p className="text-sm text-muted-foreground">분석에 실패했습니다. 다시 시도해주세요.</p>
          <Button variant="outline" size="sm" onClick={analyze}>다시 시도</Button>
        </div>
      )}

      {data && !loading && (
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">📋 기업 개요</p>
            <p className="text-sm leading-relaxed">{data.overview}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">🏢 핵심 사업</p>
            <div className="flex flex-wrap gap-1.5">
              {data.mainBusiness.map((b) => (
                <Badge key={b} variant="secondary">{b}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">📰 최근 이슈</p>
            <ul className="flex flex-col gap-1.5">
              {data.recentNews.map((n) => (
                <li key={n} className="text-sm text-foreground/80 before:content-['•'] before:mr-2 before:text-muted-foreground">{n}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">✏️ 지원 동기 포인트</p>
            <ul className="flex flex-col gap-1.5">
              {data.motivationHints.map((h) => (
                <li key={h} className="text-sm text-foreground/80 before:content-['•'] before:mr-2 before:text-muted-foreground">{h}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: page.tsx에 CompanySummary 삽입**

`app/(tabs)/applications/[id]/page.tsx`에서:

1. import 추가 (기존 import들 아래에):
```tsx
import { CompanySummary } from './_components/CompanySummary';
```

2. 자기소개서 섹션(`<section>`) 위에 삽입:
```tsx
{/* 기업 분석 섹션 */}
<div className="mb-8">
  <CompanySummary applicationId={id} />
</div>
```

- [ ] **Step 3: 린트 및 타입 에러 확인**

```bash
npx eslint app/\(tabs\)/applications/\\[id\\]/_components/CompanySummary.tsx app/\(tabs\)/applications/\\[id\\]/page.tsx
npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 4: Commit**

```bash
git add "app/(tabs)/applications/[id]/_components/CompanySummary.tsx" "app/(tabs)/applications/[id]/page.tsx"
git commit -m "feat: 기업 분석 UI 컴포넌트 추가"
```

---

## Task 7: 전체 테스트 실행 및 최종 커밋

- [ ] **Step 1: 전체 테스트 실행**

```bash
npx jest --no-coverage
```

Expected: PASS (기존 테스트 포함 전체 통과)

- [ ] **Step 2: 로컬 서버로 수동 검증**

```bash
npm run dev
```

1. `http://localhost:3000/applications/{id}` 접속
2. "AI로 기업 분석하기" 버튼 클릭
3. FlameLoading 표시 → 결과 카드 렌더링 확인
4. 새로고침 버튼 클릭 시 캐시 반환 (빠름) 확인

- [ ] **Step 3: 최종 Push**

```bash
git push origin master
```
