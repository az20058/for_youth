# P2 개선 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ForYouth 프로젝트의 P2 개선 사항 네 가지(staleTime 증가, 소프트 딜리트, 퀴즈 결과 DB 저장, 만료 정책 정리)를 구현한다.

**Architecture:** 독립적인 항목을 먼저 처리(P2-3 → P2-2 확인), 이후 스키마 변경이 필요한 항목(P2-1 → P2-5) 순서로 진행한다. P2-4(스트리밍)는 공수가 크고 체감 효과 대비 리스크가 높아 이번 사이클에서 제외한다.

**Tech Stack:** Next.js 16 App Router, Prisma (PostgreSQL/Neon), Zustand, TanStack Query, next-auth

---

## 파일 변경 맵

| 태스크 | 파일 | 변경 유형 |
|--------|------|-----------|
| P2-3 | `app/providers.tsx` | 수정 |
| P2-1 | `prisma/schema.prisma` | 수정 |
| P2-1 | `prisma/migrations/TIMESTAMP_soft_delete/` | 생성 |
| P2-1 | `app/api/applications/route.ts` | 수정 |
| P2-1 | `app/api/applications/[id]/route.ts` | 수정 |
| P2-1 | `app/api/applications/[id]/company-summary/route.ts` | 수정 |
| P2-1 | `app/api/schedule/route.ts` | 수정 |
| P2-5 | `prisma/schema.prisma` | 수정 |
| P2-5 | `prisma/migrations/TIMESTAMP_quiz_result/` | 생성 |
| P2-5 | `app/api/quiz/result/route.ts` | 생성 |
| P2-5 | `app/quiz/_components/QuizFlow.tsx` | 수정 |
| DOCS | `docs/improvements/p2-improvements.md` | 생성 |

---

## Task 1: P2-3 — React Query staleTime 증가

**Files:**
- Modify: `app/providers.tsx`

- [ ] **Step 1: staleTime 수정**

`app/providers.tsx`의 `staleTime: 60 * 1000`을 `staleTime: 5 * 60 * 1000`으로 변경한다.

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SessionProvider } from 'next-auth/react'
import { useState } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
          },
        },
      })
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  )
}
```

- [ ] **Step 2: 타입 에러 확인**

```bash
npx tsc --noEmit 2>&1 | grep -v '\.next/'
```

Expected: 출력 없음(에러 없음).

- [ ] **Step 3: 커밋**

```bash
git add app/providers.tsx
git commit -m "perf: React Query staleTime을 60초에서 5분으로 증가"
```

---

## Task 2: P2-2 — 만료 정책 정리 확인 (P1-2로 이미 해결됨)

**Files:** 없음 (확인만)

P1-2에서 배치 싱크를 `deleteMany({ where: { plcyNo: { notIn: incomingIds } } })`로 변경했다.
`fetchFromYouthApi`는 이미 `isActive()` 필터로 만료 정책을 제외하고 반환하므로,
배치 싱크 실행 시 만료된 정책은 자동으로 DB에서 삭제된다.
별도 정리 잡 없이 P2-2가 충족된다.

- [ ] **Step 1: 확인 후 문서화 태스크에서 P2-2 처리됨을 기록**

추가 코드 변경 없음.

---

## Task 3: P2-1 — Application 소프트 딜리트

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/TIMESTAMP_soft_delete/migration.sql`
- Modify: `app/api/applications/route.ts`
- Modify: `app/api/applications/[id]/route.ts`
- Modify: `app/api/applications/[id]/company-summary/route.ts`
- Modify: `app/api/schedule/route.ts`

소프트 딜리트 구현 시 `deletedAt: null` 조건을 모든 Application 조회에 추가해야 한다.
빠뜨리면 삭제된 지원서가 노출되는 버그가 발생한다.

### Step 3-1: schema.prisma 수정

`Application` 모델에 `deletedAt` 필드 추가:

```prisma
model Application {
  id           String            @id @default(cuid())
  companyName  String
  careerLevel  String
  deadline     DateTime?
  companySize  CompanySize
  status       ApplicationStatus @default(PENDING)
  url          String?
  coverLetters   CoverLetter[]
  userId       String?
  user         User?             @relation(fields: [userId], references: [id])
  deletedAt    DateTime?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  @@index([userId])
  @@index([userId, status])
  @@index([deadline])
}
```

- [ ] schema.prisma에서 `updatedAt    DateTime          @updatedAt` 다음 줄 (인덱스 앞)에 `deletedAt    DateTime?`을 추가한다.

### Step 3-2: 마이그레이션 SQL 작성

```bash
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_soft_delete
```

`migration.sql` 내용:
```sql
-- AlterTable
ALTER TABLE "Application" ADD COLUMN "deletedAt" TIMESTAMP(3);
```

- [ ] 타임스탬프 디렉토리를 만들고 위 SQL로 `migration.sql`을 생성한다.
- [ ] `node_modules/.bin/prisma generate`를 실행해 Prisma Client를 재생성한다.

### Step 3-3: app/api/applications/route.ts 수정

GET의 `findMany`에 `deletedAt: null` 추가:

```typescript
const apps = await prisma.application.findMany({
  where: { userId, deletedAt: null },
  include: { coverLetters: true },
  orderBy: { createdAt: 'desc' },
});
```

- [ ] 위와 같이 수정한다.

### Step 3-4: app/api/applications/[id]/route.ts 수정

`findApp` 함수에 `deletedAt: null` 추가:

```typescript
function findApp(id: string, userId: string) {
  return prisma.application.findFirst({
    where: { id, userId, deletedAt: null },
    include: { coverLetters: true },
  });
}
```

DELETE 핸들러를 실제 삭제 대신 소프트 딜리트로 변경:

```typescript
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });

  const { id } = await params;
  const app = await findApp(id, userId);
  if (!app) return Response.json({ message: '지원서를 찾을 수 없습니다.' }, { status: 404 });

  await prisma.application.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return new Response(null, { status: 204 });
}
```

- [ ] 위 두 가지를 수정한다.

### Step 3-5: app/api/applications/[id]/company-summary/route.ts 수정

`findFirst`에 `deletedAt: null` 추가:

```typescript
const application = await prisma.application.findFirst({
  where: { id, userId, deletedAt: null },
  select: { companyName: true },
});
```

- [ ] 위와 같이 수정한다.

### Step 3-6: app/api/schedule/route.ts 수정

캘린더 마감일 조회의 Application `findMany`에 `deletedAt: null` 추가:

```typescript
prisma.application.findMany({
  where: {
    userId,
    deletedAt: null,
    deadline: { gte: startDate, lte: endDate },
  },
  select: {
    id: true,
    companyName: true,
    deadline: true,
    status: true,
  },
  orderBy: { deadline: 'asc' },
}),
```

- [ ] 위와 같이 수정한다.

### Step 3-7: 타입 에러 및 lint 확인

```bash
npx tsc --noEmit 2>&1 | grep -v '\.next/'
```

Expected: 출력 없음.

```bash
node_modules/.bin/eslint app/api/applications/route.ts 'app/api/applications/[id]/route.ts' 'app/api/applications/[id]/company-summary/route.ts' app/api/schedule/route.ts
```

Expected: 출력 없음.

### Step 3-8: 테스트 실행

```bash
npx jest
```

Expected: 모든 테스트 PASS.

### Step 3-9: 커밋

```bash
git add prisma/schema.prisma prisma/migrations/ \
  app/api/applications/route.ts \
  'app/api/applications/[id]/route.ts' \
  'app/api/applications/[id]/company-summary/route.ts' \
  app/api/schedule/route.ts
git commit -m "feat: Application 소프트 딜리트 추가, 삭제된 지원서 복구 가능"
```

---

## Task 4: P2-5 — 퀴즈 결과 DB 저장

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/TIMESTAMP_quiz_result/migration.sql`
- Create: `app/api/quiz/result/route.ts`
- Modify: `app/quiz/_components/QuizFlow.tsx`

로그인 사용자의 퀴즈 결과를 DB에 저장한다. 비로그인 사용자는 기존 localStorage 방식 유지.

### Step 4-1: schema.prisma 수정

`UserQuizResult` 모델 추가 및 `User` 모델에 관계 추가:

```prisma
model UserQuizResult {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  answers         String   @db.Text
  recommendations String   @db.Text
  createdAt       DateTime @default(now())

  @@index([userId])
}
```

`User` 모델에 관계 필드 추가:
```prisma
model User {
  ...
  quizResults    UserQuizResult[]
  ...
}
```

- [ ] 위 두 가지를 schema.prisma에 추가한다.

### Step 4-2: 마이그레이션 SQL 작성

```bash
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_add_quiz_result
```

`migration.sql` 내용:
```sql
-- CreateTable
CREATE TABLE "UserQuizResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserQuizResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserQuizResult_userId_idx" ON "UserQuizResult"("userId");

-- AddForeignKey
ALTER TABLE "UserQuizResult" ADD CONSTRAINT "UserQuizResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] 타임스탬프 디렉토리를 만들고 위 SQL로 `migration.sql`을 생성한다.
- [ ] `node_modules/.bin/prisma generate`로 Prisma Client 재생성한다.

### Step 4-3: POST /api/quiz/result route 생성

`app/api/quiz/result/route.ts` 생성:

```typescript
import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';
import type { Recommendation, QuizAnswers } from '@/lib/quiz';

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });

  const body = await request.json() as { answers: QuizAnswers; recommendations: Recommendation[] };
  if (!body.answers || !body.recommendations) {
    return Response.json({ message: '잘못된 요청입니다.' }, { status: 400 });
  }

  await prisma.userQuizResult.create({
    data: {
      userId,
      answers: JSON.stringify(body.answers),
      recommendations: JSON.stringify(body.recommendations),
    },
  });

  return Response.json({ success: true }, { status: 201 });
}
```

- [ ] 위 파일을 생성한다.

### Step 4-4: QuizFlow.tsx 수정

`handleSubmit` 함수에서 API 저장 로직을 추가한다. `useSession`을 import하고, 로그인 상태일 때만 서버 저장 호출:

```typescript
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
// ... 기존 imports 유지
```

`QuizFlow` 함수 내부에 세션 훅 추가:
```typescript
export function QuizFlow() {
  const { data: session } = useSession();
  // ... 기존 state 유지
```

`handleSubmit` 함수 교체 (localStorage 저장은 유지, 로그인 시 서버 저장 추가):

```typescript
async function handleSubmit() {
  setStep("loading");
  try {
    const res = await fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    if (!res.ok) throw new Error("추천 실패");
    const data = await res.json();
    setResult(data.recommendations);
    localStorage.setItem(
      "ember_recommendations",
      JSON.stringify(data.recommendations),
    );

    if (session?.user) {
      fetch("/api/quiz/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, recommendations: data.recommendations }),
      }).catch(() => null);
    }

    setStep("result");
  } catch {
    setStep("result");
  }
}
```

> 서버 저장은 `await` 없이 fire-and-forget으로 처리한다. 실패해도 사용자 경험에 영향을 주지 않는다.

- [ ] 위와 같이 QuizFlow.tsx를 수정한다.

### Step 4-5: 타입 에러 및 lint 확인

```bash
npx tsc --noEmit 2>&1 | grep -v '\.next/'
```

Expected: 출력 없음.

```bash
node_modules/.bin/eslint app/api/quiz/result/route.ts app/quiz/_components/QuizFlow.tsx
```

Expected: 출력 없음.

### Step 4-6: 테스트 실행

```bash
npx jest
```

Expected: 모든 테스트 PASS.

### Step 4-7: 커밋

```bash
git add prisma/schema.prisma prisma/migrations/ \
  app/api/quiz/result/route.ts \
  app/quiz/_components/QuizFlow.tsx
git commit -m "feat: 로그인 사용자의 퀴즈 결과를 DB에 저장, 기기 간 추천 이력 유지"
```

---

## Task 5: 개선 사항 문서화

**Files:**
- Create: `docs/improvements/p2-improvements.md`

- [ ] **Step 1: 문서 작성 후 커밋**

```bash
git add docs/improvements/p2-improvements.md
git commit -m "docs: P2 개선 사항 문서화"
```
