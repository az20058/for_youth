# P1 개선 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ForYouth 프로젝트의 P1 우선순위 세 가지 개선 사항(DB 인덱스, 배치 싱크 upsert 전환, CompanySummary 공유 캐시)을 구현한다.

**Architecture:** P1-3(인덱스)과 P1-2(배치 싱크)는 독립적으로 먼저 처리하고, P1-1(CompanySummary 공유 캐시)은 Prisma 마이그레이션이 포함되어 마지막에 처리한다. 각 태스크는 개별 커밋으로 완결된다.

**Tech Stack:** Next.js 16 App Router, Prisma (PostgreSQL/Neon), TypeScript, Jest

---

## 파일 변경 맵

| 태스크 | 파일 | 변경 유형 |
|--------|------|-----------|
| P1-3 | `prisma/schema.prisma` | 수정 |
| P1-2 | `app/api/batch/sync-policies/route.ts` | 수정 |
| P1-1 | `prisma/schema.prisma` | 수정 |
| P1-1 | `prisma/migrations/` | 생성 (마이그레이션) |
| P1-1 | `app/api/applications/[id]/company-summary/route.ts` | 수정 |
| P1-1 | `__tests__/companySummary.test.ts` | 수정 |
| DOCS | `docs/improvements/p1-improvements.md` | 생성 |

---

## Task 1: P1-3 — DB 인덱스 추가

**Files:**
- Modify: `prisma/schema.prisma`

현재 `schema.prisma`에는 인덱스가 전혀 없다. 자주 사용되는 조회 패턴에 맞게 인덱스를 추가한다.

- `Application`: userId(목록 조회), userId+status(필터), deadline(일정 조회)
- `ScheduleEvent`: userId(목록 조회)
- `YouthPolicy`: region(지역 필터), mainCategory(카테고리 필터)

- [ ] **Step 1: schema.prisma에 인덱스 추가**

`prisma/schema.prisma`의 각 모델 끝에 아래 인덱스를 추가한다.

`Application` 모델 (line 24 `updatedAt` 다음에 추가):
```prisma
  @@index([userId])
  @@index([userId, status])
  @@index([deadline])
```

`ScheduleEvent` 모델 (line 105 `updatedAt` 다음에 추가):
```prisma
  @@index([userId])
```

`YouthPolicy` 모델 (line 141 `updatedAt` 다음에 추가):
```prisma
  @@index([region])
  @@index([mainCategory])
```

- [ ] **Step 2: 마이그레이션 생성 및 적용**

```bash
npx prisma migrate dev --name add-indexes
```

Expected: `prisma/migrations/` 아래 새 마이그레이션 파일 생성, `✓ Generated Prisma Client` 출력.

- [ ] **Step 3: 타입 에러 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "perf: DB 인덱스 추가 (Application, ScheduleEvent, YouthPolicy)"
```

---

## Task 2: P1-2 — 배치 싱크 upsert 방식으로 전환

**Files:**
- Modify: `app/api/batch/sync-policies/route.ts`

현재 `deleteMany()` → `createMany()` 트랜잭션은 싱크 중 테이블이 완전히 비는 공백을 만든다. 아래 순서로 변경한다:

1. API에서 가져온 정책 ID 목록을 추출한다.
2. DB에서 해당 ID에 없는(만료/제거된) 정책만 삭제한다.
3. 새 정책은 `createMany({ skipDuplicates: true })`로 추가한다.
4. 기존 정책은 `Promise.all` + 개별 `update`로 갱신한다. (viewCount는 유지)

- [ ] **Step 1: 현재 route.ts 읽기**

파일은 이미 읽었다. 내용 확인:
- `prisma.$transaction([deleteMany(), createMany()])` 사용 중
- `plcyNo`가 YouthPolicy PK → upsert 키로 사용 가능

- [ ] **Step 2: route.ts 수정**

`app/api/batch/sync-policies/route.ts`를 아래와 같이 교체한다:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fetchFromYouthApi } from '@/lib/youthApi';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const policies = await fetchFromYouthApi();

    if (policies.length === 0) {
      return NextResponse.json({ message: 'No policies fetched', synced: 0 });
    }

    const incomingIds = policies.map((p) => p.id!);

    // 1. API 응답에 없는 정책(만료/제거)만 삭제 — 데이터 공백 없음
    await prisma.youthPolicy.deleteMany({
      where: { plcyNo: { notIn: incomingIds } },
    });

    // 2. 신규 정책 삽입 (기존 ID는 건너뜀)
    await prisma.youthPolicy.createMany({
      data: policies.map((p) => ({
        plcyNo: p.id!,
        name: p.name,
        agency: p.agency,
        mainCategory: p.mainCategory,
        category: p.category,
        description: p.description,
        supportContent: p.supportContent ?? null,
        applicationUrl: p.applicationUrl ?? null,
        viewCount: p.viewCount ?? 0,
        region: p.region ?? null,
        zipCodes: p.zipCodes ?? null,
        bizPrdEndYmd: null,
      })),
      skipDuplicates: true,
    });

    // 3. 기존 정책 필드 갱신 (viewCount 제외)
    await Promise.all(
      policies.map((p) =>
        prisma.youthPolicy.update({
          where: { plcyNo: p.id! },
          data: {
            name: p.name,
            agency: p.agency,
            mainCategory: p.mainCategory,
            category: p.category,
            description: p.description,
            supportContent: p.supportContent ?? null,
            applicationUrl: p.applicationUrl ?? null,
            region: p.region ?? null,
            zipCodes: p.zipCodes ?? null,
          },
        }).catch(() => null), // 방금 insert된 경우에도 무시
      ),
    );

    return NextResponse.json({ message: 'Sync complete', synced: policies.length });
  } catch (err) {
    console.error('[sync-policies]', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
```

- [ ] **Step 3: 타입 에러 및 lint 확인**

```bash
npx tsc --noEmit && npx eslint app/api/batch/sync-policies/route.ts
```

Expected: 에러 없음. (lint 경고가 있다면 내용 확인 후 판단)

- [ ] **Step 4: 커밋**

```bash
git add app/api/batch/sync-policies/route.ts
git commit -m "perf: 배치 싱크를 upsert 방식으로 변경, 데이터 공백 제거"
```

---

## Task 3: P1-1 — CompanySummary 공유 캐시 전환 (스키마)

**Files:**
- Modify: `prisma/schema.prisma`

현재 `CompanySummary`는 `applicationId`를 FK로 가져 유저마다 별도 Claude 호출이 발생한다.
`companyName`을 유니크 키로 사용하는 독립 모델로 전환한다.

- [ ] **Step 1: schema.prisma 수정**

`CompanySummary` 모델을 다음으로 교체한다:

```prisma
model CompanySummary {
  id              String   @id @default(cuid())
  companyName     String   @unique
  overview        String   @db.Text
  mainBusiness    String   @db.Text
  recentNews      String   @db.Text
  motivationHints String   @db.Text
  crawledAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

`Application` 모델에서 `companySummary CompanySummary?` 관계 필드를 제거한다:

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
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  @@index([userId])
  @@index([userId, status])
  @@index([deadline])
}
```

- [ ] **Step 2: 마이그레이션 생성**

```bash
npx prisma migrate dev --name shared-company-summary
```

> 주의: 기존 `CompanySummary` 데이터가 있으면 마이그레이션 중 드롭된다. 개발 환경에서는 무방하다.

Expected: 마이그레이션 파일 생성 및 Prisma Client 재생성 완료.

- [ ] **Step 3: 타입 에러 확인 (마이그레이션 후 첫 번째 확인)**

```bash
npx tsc --noEmit
```

이 시점에서 `app/api/applications/[id]/company-summary/route.ts`에 타입 에러가 발생한다 (applicationId 참조). 다음 태스크에서 수정한다.

---

## Task 4: P1-1 — CompanySummary API route 수정

**Files:**
- Modify: `app/api/applications/[id]/company-summary/route.ts`
- Modify: `__tests__/companySummary.test.ts`

- [ ] **Step 1: route.ts 수정**

`app/api/applications/[id]/company-summary/route.ts`를 아래로 교체한다:

```typescript
import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';
import { crawlCompanyInfo } from '@/lib/crawl';
import { summarizeCompany } from '@/lib/companySummary';

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

function normalizeCompanyName(name: string): string {
  return name.trim();
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });

  const { id } = await params;

  const application = await prisma.application.findFirst({
    where: { id, userId },
    select: { companyName: true },
  });
  if (!application) return Response.json({ message: '지원서를 찾을 수 없습니다.' }, { status: 404 });

  const companyName = normalizeCompanyName(application.companyName);

  const existing = await prisma.companySummary.findUnique({ where: { companyName } });
  if (existing && Date.now() - existing.crawledAt.getTime() < CACHE_DURATION_MS) {
    return Response.json({
      overview: existing.overview,
      mainBusiness: JSON.parse(existing.mainBusiness) as string[],
      recentNews: JSON.parse(existing.recentNews) as string[],
      motivationHints: JSON.parse(existing.motivationHints) as string[],
      crawledAt: existing.crawledAt.toISOString(),
    });
  }

  try {
    const crawlResult = await crawlCompanyInfo(companyName);
    if (!crawlResult.namuWiki && crawlResult.newsHeadlines.length === 0) {
      return Response.json({ message: '기업 정보를 찾을 수 없습니다.' }, { status: 422 });
    }

    const summary = await summarizeCompany(companyName, crawlResult);

    const saved = await prisma.companySummary.upsert({
      where: { companyName },
      create: {
        companyName,
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

    return Response.json({
      overview: summary.overview,
      mainBusiness: summary.mainBusiness,
      recentNews: summary.recentNews,
      motivationHints: summary.motivationHints,
      crawledAt: saved.crawledAt.toISOString(),
    });
  } catch (err) {
    console.error('[company-summary]', err);
    return Response.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
```

- [ ] **Step 2: 타입 에러 및 lint 확인**

```bash
npx tsc --noEmit && npx eslint app/api/applications/[id]/company-summary/route.ts
```

Expected: 에러 없음.

- [ ] **Step 3: 테스트 확인**

기존 `__tests__/companySummary.test.ts`는 `summarizeCompany` 함수를 테스트하므로 변경 불필요. 테스트 실행:

```bash
npx jest __tests__/companySummary.test.ts
```

Expected: 3개 테스트 모두 PASS.

- [ ] **Step 4: 전체 테스트 스위트 실행**

```bash
npx jest
```

Expected: 모든 테스트 PASS.

- [ ] **Step 5: 커밋**

```bash
git add prisma/schema.prisma prisma/migrations/ app/api/applications/[id]/company-summary/route.ts
git commit -m "feat: CompanySummary를 기업명 기준 공유 캐시로 전환, Claude API 중복 호출 제거"
```

---

## Task 5: 개선 사항 문서화

**Files:**
- Create: `docs/improvements/p1-improvements.md`

- [ ] **Step 1: docs/improvements 디렉토리에 문서 작성**

이 태스크는 구현 완료 후 실행한다. 각 개선 내용, 변경된 파일, 이전/이후 동작 차이를 기록한다.

- [ ] **Step 2: 커밋**

```bash
git add docs/improvements/p1-improvements.md
git commit -m "docs: P1 개선 사항 문서화"
```
