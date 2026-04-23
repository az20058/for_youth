# 알림 시스템 구현 플랜 (신규 정책 매칭 · 일정 D-3/D-1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자에 맞는 신규 정책이 등록될 때 묶음 알림, 수동 일정·지원서 마감일의 D-3/D-1 알림을 발생시키고, 웹은 인앱 벨에 누적·모바일 앱은 Expo 푸시로 받도록 구현한다.

**Architecture:** Vercel Cron 2개(`02:00` nightly / `09:00` morning)로 알림 생성·전송을 분리. 생성은 DB(`Notification.dedupeKey @unique`)로 재시도 안전, 전송은 `pushedAt` 플래그로 idempotent하게 처리. 모바일은 Expo Notifications로 토큰을 받아 WebView 브릿지로 웹에 주입하고, 웹이 세션 쿠키로 `/api/push-tokens`에 등록.

**Tech Stack:** Next.js 16 App Router · Prisma 7 (Neon Postgres) · NextAuth v5 · React Query · Expo 54 · expo-notifications · Expo Push Service

**Spec:** `docs/superpowers/specs/2026-04-23-notifications-spec.md`

---

## 파일 구조 (생성·수정 맵)

**생성:**
- `lib/dateKst.ts` — KST 기준 날짜 유틸 (todayKstStart/addDays/kstDateKey/isSameKstDay)
- `lib/scheduleCompletion.ts` — 이벤트 완료 판정 로직 (type × application status)
- `lib/expoPush.ts` — Expo Push API 호출 래퍼
- `lib/usePushTokenRegister.ts` — 웹 측 토큰 등록 훅
- `app/api/push-tokens/route.ts` — POST 신규
- `app/api/batch/nightly/route.ts` — 정책 sync + 매칭
- `app/api/batch/morning/route.ts` — D-3/D-1 + 푸시 전송
- `__tests__/dateKst.test.ts`
- `__tests__/scheduleCompletion.test.ts`
- `__tests__/expoPush.test.ts`
- `__tests__/recommend/scoreAndFilter.test.ts`
- `__tests__/batch/nightly.test.ts`
- `__tests__/batch/morning.test.ts`
- `__tests__/api/push-tokens.test.ts`
- `__tests__/api/schedule-patch.test.ts`
- `mobile/hooks/usePushToken.ts`

**수정:**
- `prisma/schema.prisma` — enum/모델 변경
- `lib/recommendUtils.ts` — `scoreAndFilterPrograms` export
- `lib/types.ts` — NotificationType 유니온 확장
- `lib/enumMaps.ts` — POLICY_MATCH 매핑
- `lib/notificationApi.ts` — registerPushToken 추가
- `app/api/schedule/route.ts` — PATCH 핸들러 추가 (completedAt 토글)
- `app/(schedule)/schedule/_components/types.ts` — ScheduleEvent에 completedAt, id, source 확장
- `app/(schedule)/schedule/_components/EventList.tsx` — 완료 체크박스
- `app/(schedule)/schedule/_components/useSchedule.ts` — PATCH 뮤테이션
- `app/(tabs)/notifications/page.tsx` — 클릭 라우팅 switch
- `app/providers.tsx` — usePushTokenRegister 호출
- `vercel.json` — 크론 스케줄 교체
- `mobile/package.json` — expo-notifications, expo-device 추가
- `mobile/app.json` — plugins, bundleIdentifier 추가
- `mobile/components/TabWebView.tsx` — 토큰 주입

**삭제:**
- `app/api/batch/sync-policies/route.ts` (로직은 nightly로 흡수)

---

## Task 1: Prisma 스키마 확장 · 마이그레이션

**Files:**
- Modify: `prisma/schema.prisma`
- Run: `npx prisma migrate dev`

- [ ] **Step 1: schema.prisma에서 NotificationType enum에 POLICY_MATCH 추가**

```prisma
enum NotificationType {
  DEADLINE
  SCHEDULE
  STATUS_CHANGE
  POLICY_MATCH
}
```

- [ ] **Step 2: Notification 모델에 dedupeKey, pushedAt, 인덱스 추가**

```prisma
model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String
  message   String
  isRead    Boolean          @default(false)
  relatedId String?
  createdAt DateTime         @default(now())

  dedupeKey String?          @unique
  pushedAt  DateTime?

  @@index([userId])
  @@index([userId, isRead])
  @@index([pushedAt])
}
```

- [ ] **Step 3: ScheduleEvent에 completedAt 추가**

```prisma
model ScheduleEvent {
  id            String            @id @default(cuid())
  title         String
  date          DateTime
  type          ScheduleEventType
  memo          String?
  userId        String
  user          User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  applicationId String?
  application   Application?      @relation(fields: [applicationId], references: [id], onDelete: SetNull)
  completedAt   DateTime?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  @@index([userId])
}
```

- [ ] **Step 4: PushToken 모델 추가 + User 역관계**

```prisma
model PushToken {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token      String   @unique
  platform   String
  lastSeenAt DateTime @default(now())
  createdAt  DateTime @default(now())

  @@index([userId])
}

model User {
  // ... 기존 필드 전부 유지 ...
  pushTokens     PushToken[]
  // ... 다른 역관계 그대로 ...
}
```

- [ ] **Step 5: 마이그레이션 생성·적용**

Run: `npx prisma migrate dev --name add_notification_push_and_completed`
Expected: `Your database is now in sync with your schema.`

- [ ] **Step 6: 기존 Notification을 푸시 완료 상태로 백필**

Prisma Studio 또는 수동 SQL로 1회 실행:
```sql
UPDATE "Notification" SET "pushedAt" = "createdAt" WHERE "pushedAt" IS NULL;
```

실제 실행: `npx prisma db execute --stdin --schema prisma/schema.prisma` 에 위 SQL 입력. 또는 Neon 콘솔에서 직접.

- [ ] **Step 7: Prisma Client 재생성**

Run: `npx prisma generate`
Expected: `✔ Generated Prisma Client`

- [ ] **Step 8: 타입·린트 확인**

Run: `npx tsc --noEmit`
Expected: PASS (신규 필드 참조 없으므로 타입 에러 없음)

- [ ] **Step 9: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: 알림 dedupeKey·pushedAt, ScheduleEvent.completedAt, PushToken 모델 추가"
```

---

## Task 2: KST 날짜 유틸 (TDD)

**Files:**
- Create: `lib/dateKst.ts`
- Test: `__tests__/dateKst.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// __tests__/dateKst.test.ts
import { todayKstStart, addDays, kstDateKey, isSameKstDay } from '@/lib/dateKst';

describe('todayKstStart', () => {
  it('KST 00:00에 해당하는 UTC Date를 반환한다', () => {
    // 2026-04-23 KST 00:00 = 2026-04-22 UTC 15:00
    jest.useFakeTimers().setSystemTime(new Date('2026-04-23T03:00:00.000Z')); // KST 12:00
    expect(todayKstStart().toISOString()).toBe('2026-04-22T15:00:00.000Z');
    jest.useRealTimers();
  });
});

describe('addDays', () => {
  it('N일을 더한 Date를 반환한다', () => {
    const base = new Date('2026-04-22T15:00:00.000Z');
    expect(addDays(base, 3).toISOString()).toBe('2026-04-25T15:00:00.000Z');
  });
});

describe('kstDateKey', () => {
  it('YYYY-MM-DD (KST) 문자열을 반환한다', () => {
    expect(kstDateKey(new Date('2026-04-22T15:00:00.000Z'))).toBe('2026-04-23');
    expect(kstDateKey(new Date('2026-04-22T14:59:59.999Z'))).toBe('2026-04-22');
  });
});

describe('isSameKstDay', () => {
  it('같은 KST 날짜면 true', () => {
    expect(isSameKstDay(
      new Date('2026-04-22T15:00:00.000Z'),
      new Date('2026-04-23T14:59:00.000Z'),
    )).toBe(true);
  });
  it('다른 KST 날짜면 false', () => {
    expect(isSameKstDay(
      new Date('2026-04-22T14:59:00.000Z'),
      new Date('2026-04-22T15:00:00.000Z'),
    )).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest __tests__/dateKst.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: lib/dateKst.ts 구현**

```ts
// lib/dateKst.ts
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function todayKstStart(): Date {
  const nowMs = Date.now();
  const kstMs = nowMs + KST_OFFSET_MS;
  const dayStartKstMs = Math.floor(kstMs / 86400000) * 86400000;
  return new Date(dayStartKstMs - KST_OFFSET_MS);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400000);
}

export function kstDateKey(d: Date): string {
  const kst = new Date(d.getTime() + KST_OFFSET_MS);
  return kst.toISOString().slice(0, 10);
}

export function isSameKstDay(a: Date, b: Date): boolean {
  return kstDateKey(a) === kstDateKey(b);
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx jest __tests__/dateKst.test.ts`
Expected: PASS (4건)

- [ ] **Step 5: Lint·tsc**

Run: `npx eslint lib/dateKst.ts __tests__/dateKst.test.ts && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/dateKst.ts __tests__/dateKst.test.ts
git commit -m "feat: KST 날짜 유틸 추가 (todayKstStart, addDays, kstDateKey, isSameKstDay)"
```

---

## Task 3: `scoreAndFilterPrograms` export 추가 (TDD)

**Files:**
- Modify: `lib/recommendUtils.ts`
- Test: `__tests__/recommend/scoreAndFilter.test.ts`

`scoreAndRankPrograms`은 score를 내부에서 소비하고 버림. 신규 정책 매칭에선 임계치 필터가 필요하므로 score 유지 변형 함수를 추가.

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// __tests__/recommend/scoreAndFilter.test.ts
import { scoreAndFilterPrograms } from '@/lib/recommendUtils';
import type { Recommendation } from '@/lib/quiz';

const policies: Recommendation[] = [
  { name: '서울 일자리 지원', agency: '서울시', mainCategory: '일자리', category: '취업지원',
    description: '서울 거주 청년 취업', matchReason: '', zipCodes: '11000' },
  { name: '무관한 복지', agency: '보건부', mainCategory: '복지문화', category: '복지',
    description: '일반 복지', matchReason: '' },
];

describe('scoreAndFilterPrograms', () => {
  it('임계치 이상인 정책만 반환한다', () => {
    const out = scoreAndFilterPrograms(policies, { need: ['employment'], region: '11' }, 2);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('서울 일자리 지원');
  });

  it('임계치를 만족하는 정책이 없으면 빈 배열', () => {
    const out = scoreAndFilterPrograms(policies, { need: ['mental'], region: '26' }, 5);
    expect(out).toEqual([]);
  });

  it('퀴즈 답변이 비었으면 빈 배열', () => {
    expect(scoreAndFilterPrograms(policies, {}, 2)).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest __tests__/recommend/scoreAndFilter.test.ts`
Expected: FAIL (함수 없음)

- [ ] **Step 3: lib/recommendUtils.ts에 함수 추가**

기존 `scoreAndRankPrograms` 위 또는 아래에 export 추가:

```ts
// lib/recommendUtils.ts (파일 끝에 추가)
export function scoreAndFilterPrograms(
  programs: Recommendation[],
  answers: QuizAnswers,
  minScore: number,
): Recommendation[] {
  const needs = (answers.need as string[] | undefined) ?? [];
  const userRegion = answers.region as string | undefined;
  const userSigungu = answers.sigungu as string | undefined;
  const status = answers.status as string | undefined;
  const income = answers.income as string | undefined;

  // 퀴즈가 실질 내용 전혀 없으면 바로 빈 배열
  if (!needs.length && !userRegion && !status && !income) return [];

  return programs
    .map((p) => {
      let score = 0;
      const searchText = `${p.name} ${p.mainCategory} ${p.category} ${p.description}`.toLowerCase();

      for (const need of needs) {
        const cats = NEED_TO_CATEGORIES[need] ?? [];
        if (cats.some((c) => p.mainCategory?.includes(c))) { score += 3; break; }
      }
      if (userRegion) {
        const validCodes = (p.zipCodes || '').split(',').map((c) => c.trim()).filter((c) => /^\d{5}$/.test(c));
        if (validCodes.length === 0) score += 1;
        else if (validCodes.some((c) => c.startsWith(userRegion))) score += 2;
      }
      if (userSigungu) {
        const kw = userSigungu.replace(/[시군구]$/, '').toLowerCase();
        if (kw && `${p.name} ${p.agency}`.toLowerCase().includes(kw)) score += 2;
      }
      if (status && STATUS_KEYWORDS[status]) {
        if (STATUS_KEYWORDS[status].some((kw) => searchText.includes(kw))) score += 1;
      }
      if (income && INCOME_KEYWORDS[income]) {
        if (INCOME_KEYWORDS[income].some((kw) => searchText.includes(kw))) score += 1;
      }
      return { program: p, score };
    })
    .filter(({ score }) => score >= minScore)
    .map(({ program }) => program);
}
```

**주의**: `NEED_TO_CATEGORIES`, `STATUS_KEYWORDS`, `INCOME_KEYWORDS`가 현재 모듈-private. `scoreAndFilterPrograms`가 같은 파일에 있으면 접근 가능. 이들 맵은 기존 함수와 공유되므로 절대 중복 선언 금지.

- [ ] **Step 4: 통과 확인**

Run: `npx jest __tests__/recommend/scoreAndFilter.test.ts`
Expected: PASS (3건)

- [ ] **Step 5: 기존 스코어 테스트 회귀 없는지 확인**

Run: `npx jest __tests__/recommend`
Expected: 기존 테스트도 모두 PASS

- [ ] **Step 6: Lint·tsc**

Run: `npx eslint lib/recommendUtils.ts __tests__/recommend/scoreAndFilter.test.ts && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/recommendUtils.ts __tests__/recommend/scoreAndFilter.test.ts
git commit -m "feat: scoreAndFilterPrograms 추가 (임계치 기반 필터)"
```

---

## Task 4: NotificationType·enumMap 확장

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/enumMaps.ts`

- [ ] **Step 1: types.ts NotificationType 유니온 확장**

```ts
// lib/types.ts (기존 라인 교체)
export type NotificationType = '마감 임박' | '일정 알림' | '상태 변경' | '신규 맞춤 정책';
```

- [ ] **Step 2: enumMaps.ts에 POLICY_MATCH 매핑 추가**

```ts
// lib/enumMaps.ts
export const NOTIFICATION_TYPE_FROM_DB: Record<DbNotificationType, NotificationType> = {
  DEADLINE: '마감 임박',
  SCHEDULE: '일정 알림',
  STATUS_CHANGE: '상태 변경',
  POLICY_MATCH: '신규 맞춤 정책',
};
```

- [ ] **Step 3: 사이드 이펙트 체크**

```bash
grep -rn "NOTIFICATION_TYPE_FROM_DB\|NotificationType" lib/ app/ components/ --include="*.ts" --include="*.tsx"
```

Expected: 모든 참조가 새 유니온·매핑을 받아들임(exhaustiveness check 통과). Type narrowing switch가 있으면 `POLICY_MATCH` 케이스 추가 필요.

- [ ] **Step 4: Lint·tsc**

Run: `npx eslint lib/types.ts lib/enumMaps.ts && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/enumMaps.ts
git commit -m "feat: NotificationType에 신규 맞춤 정책 추가"
```

---

## Task 5: ScheduleEvent 완료 판정 유틸 (TDD)

**Files:**
- Create: `lib/scheduleCompletion.ts`
- Test: `__tests__/scheduleCompletion.test.ts`

- [ ] **Step 1: 실패하는 테스트**

```ts
// __tests__/scheduleCompletion.test.ts
import { isEventCompleted } from '@/lib/scheduleCompletion';

describe('isEventCompleted', () => {
  it('완료 표시된 이벤트는 true', () => {
    expect(isEventCompleted({ completedAt: new Date(), type: 'CODING_TEST' }, null)).toBe(true);
  });

  it('applicationId 없고 completedAt 없으면 false', () => {
    expect(isEventCompleted({ completedAt: null, type: 'CODING_TEST' }, null)).toBe(false);
  });

  it('CODING_TEST: 연결된 application이 INTERVIEW면 true', () => {
    expect(isEventCompleted({ completedAt: null, type: 'CODING_TEST' }, { status: 'INTERVIEW' })).toBe(true);
  });

  it('CODING_TEST: 연결된 application이 PENDING이면 false', () => {
    expect(isEventCompleted({ completedAt: null, type: 'CODING_TEST' }, { status: 'PENDING' })).toBe(false);
  });

  it('CODING_TEST: 모든 REJECTED_* 상태는 true', () => {
    (['REJECTED_DOCS', 'REJECTED_CODING', 'REJECTED_INTERVIEW'] as const).forEach((s) => {
      expect(isEventCompleted({ completedAt: null, type: 'CODING_TEST' }, { status: s })).toBe(true);
    });
  });

  it('INTERVIEW: application이 APPLIED 또는 ACCEPTED면 true, CODING_TEST이면 false', () => {
    expect(isEventCompleted({ completedAt: null, type: 'INTERVIEW' }, { status: 'APPLIED' })).toBe(true);
    expect(isEventCompleted({ completedAt: null, type: 'INTERVIEW' }, { status: 'ACCEPTED' })).toBe(true);
    expect(isEventCompleted({ completedAt: null, type: 'INTERVIEW' }, { status: 'CODING_TEST' })).toBe(false);
  });

  it('DOCUMENT: application이 PENDING이 아니면 true', () => {
    expect(isEventCompleted({ completedAt: null, type: 'DOCUMENT' }, { status: 'CODING_TEST' })).toBe(true);
    expect(isEventCompleted({ completedAt: null, type: 'DOCUMENT' }, { status: 'PENDING' })).toBe(false);
  });

  it('OTHER: completedAt만 보고 application 상태 무시', () => {
    expect(isEventCompleted({ completedAt: null, type: 'OTHER' }, { status: 'REJECTED_CODING' })).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest __tests__/scheduleCompletion.test.ts`
Expected: FAIL

- [ ] **Step 3: 구현**

```ts
// lib/scheduleCompletion.ts
import type { ApplicationStatus, ScheduleEventType } from './generated/prisma/client';

export interface EventInput {
  completedAt: Date | null;
  type: ScheduleEventType;
}
export interface AppInput {
  status: ApplicationStatus;
}

export function isEventCompleted(event: EventInput, app: AppInput | null): boolean {
  if (event.completedAt) return true;
  if (!app) return false;
  const s = app.status;
  if (s === 'REJECTED_DOCS' || s === 'REJECTED_CODING' || s === 'REJECTED_INTERVIEW') return true;
  if (event.type === 'CODING_TEST') {
    return s === 'INTERVIEW' || s === 'APPLIED' || s === 'ACCEPTED';
  }
  if (event.type === 'INTERVIEW') {
    return s === 'APPLIED' || s === 'ACCEPTED';
  }
  if (event.type === 'DOCUMENT') {
    return s !== 'PENDING';
  }
  return false; // OTHER
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx jest __tests__/scheduleCompletion.test.ts`
Expected: PASS (8건)

- [ ] **Step 5: Lint·tsc**

Run: `npx eslint lib/scheduleCompletion.ts __tests__/scheduleCompletion.test.ts && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/scheduleCompletion.ts __tests__/scheduleCompletion.test.ts
git commit -m "feat: ScheduleEvent 완료 판정 유틸 (상태 × 이벤트 타입 매트릭스)"
```

---

## Task 6: Expo Push 래퍼 (TDD)

**Files:**
- Create: `lib/expoPush.ts`
- Test: `__tests__/expoPush.test.ts`

- [ ] **Step 1: 실패하는 테스트**

```ts
// __tests__/expoPush.test.ts
import { sendExpoPush, chunk } from '@/lib/expoPush';

beforeEach(() => { global.fetch = jest.fn(); });

describe('chunk', () => {
  it('N개 단위로 배열을 쪼갠다', () => {
    expect(chunk([1,2,3,4,5], 2)).toEqual([[1,2],[3,4],[5]]);
    expect(chunk([], 10)).toEqual([]);
  });
});

describe('sendExpoPush', () => {
  it('Expo Push API를 호출하고 응답 티켓을 반환한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [{ status: 'ok', id: 'tkt1' }] }),
    });
    const tickets = await sendExpoPush([{ to: 'ExponentPushToken[x]', title: 't', body: 'b', data: {} }]);
    expect(fetch).toHaveBeenCalledWith(
      'https://exp.host/--/api/v2/push/send',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(tickets).toEqual([{ status: 'ok', id: 'tkt1' }]);
  });

  it('빈 배열이면 호출하지 않고 빈 배열 반환', async () => {
    const tickets = await sendExpoPush([]);
    expect(fetch).not.toHaveBeenCalled();
    expect(tickets).toEqual([]);
  });

  it('HTTP 실패 시 전체를 에러 티켓으로 변환', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) });
    const tickets = await sendExpoPush([{ to: 'x', title: 't', body: 'b' }]);
    expect(tickets).toEqual([{ status: 'error', details: { error: 'NetworkFailure' } }]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest __tests__/expoPush.test.ts`
Expected: FAIL

- [ ] **Step 3: 구현**

```ts
// lib/expoPush.ts
export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
}

export interface ExpoPushTicketOk { status: 'ok'; id: string }
export interface ExpoPushTicketError {
  status: 'error';
  message?: string;
  details?: { error?: string };
}
export type ExpoPushTicket = ExpoPushTicketOk | ExpoPushTicketError;

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'accept-encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      return messages.map(() => ({ status: 'error', details: { error: 'NetworkFailure' } }));
    }
    const body = (await res.json()) as { data: ExpoPushTicket[] };
    return body.data;
  } catch {
    return messages.map(() => ({ status: 'error', details: { error: 'NetworkFailure' } }));
  }
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx jest __tests__/expoPush.test.ts`
Expected: PASS (4건)

- [ ] **Step 5: Lint·tsc**

Run: `npx eslint lib/expoPush.ts __tests__/expoPush.test.ts && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/expoPush.ts __tests__/expoPush.test.ts
git commit -m "feat: Expo Push API 호출 래퍼 추가"
```

---

## Task 7: POST /api/push-tokens 라우트 (TDD)

**Files:**
- Create: `app/api/push-tokens/route.ts`
- Test: `__tests__/api/push-tokens.test.ts`

- [ ] **Step 1: 실패하는 테스트**

```ts
// __tests__/api/push-tokens.test.ts
/** @jest-environment node */
import { POST } from '@/app/api/push-tokens/route';
import { prisma } from '@/lib/db';

jest.mock('@/lib/auth', () => ({
  getAuthenticatedUserId: jest.fn(),
}));
jest.mock('@/lib/db', () => ({
  prisma: { pushToken: { upsert: jest.fn() } },
}));

import { getAuthenticatedUserId } from '@/lib/auth';

function req(body: unknown): Request {
  return new Request('http://x/api/push-tokens', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/push-tokens', () => {
  beforeEach(() => jest.clearAllMocks());

  it('미인증 → 401', async () => {
    (getAuthenticatedUserId as jest.Mock).mockResolvedValue(null);
    const res = await POST(req({ token: 'ExponentPushToken[x]', platform: 'ios' }));
    expect(res.status).toBe(401);
  });

  it('잘못된 토큰 포맷 → 400', async () => {
    (getAuthenticatedUserId as jest.Mock).mockResolvedValue('u1');
    const res = await POST(req({ token: 'invalid', platform: 'ios' }));
    expect(res.status).toBe(400);
  });

  it('잘못된 platform → 400', async () => {
    (getAuthenticatedUserId as jest.Mock).mockResolvedValue('u1');
    const res = await POST(req({ token: 'ExponentPushToken[abc]', platform: 'windows' }));
    expect(res.status).toBe(400);
  });

  it('정상 입력 → upsert 호출, 200', async () => {
    (getAuthenticatedUserId as jest.Mock).mockResolvedValue('u1');
    (prisma.pushToken.upsert as jest.Mock).mockResolvedValue({});
    const res = await POST(req({ token: 'ExponentPushToken[abc]', platform: 'ios' }));
    expect(res.status).toBe(200);
    expect(prisma.pushToken.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { token: 'ExponentPushToken[abc]' },
    }));
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest __tests__/api/push-tokens.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

```ts
// app/api/push-tokens/route.ts
import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';

const TOKEN_RE = /^ExponentPushToken\[.+\]$/;

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }
  const body = (await request.json()) as { token?: unknown; platform?: unknown };
  const token = typeof body.token === 'string' ? body.token : '';
  const platform = body.platform === 'ios' || body.platform === 'android' ? body.platform : null;

  if (!TOKEN_RE.test(token)) {
    return Response.json({ message: '유효하지 않은 토큰입니다.' }, { status: 400 });
  }
  if (!platform) {
    return Response.json({ message: 'platform은 ios 또는 android여야 합니다.' }, { status: 400 });
  }

  await prisma.pushToken.upsert({
    where: { token },
    create: { token, platform, userId },
    update: { userId, platform, lastSeenAt: new Date() },
  });

  return Response.json({ success: true });
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx jest __tests__/api/push-tokens.test.ts`
Expected: PASS (4건)

- [ ] **Step 5: Lint·tsc**

Run: `npx eslint app/api/push-tokens/route.ts && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/api/push-tokens/route.ts __tests__/api/push-tokens.test.ts
git commit -m "feat: POST /api/push-tokens 추가 (Expo 푸시 토큰 upsert)"
```

---

## Task 8: PATCH /api/schedule (completedAt 토글) (TDD)

**Files:**
- Modify: `app/api/schedule/route.ts`
- Test: `__tests__/api/schedule-patch.test.ts`

- [ ] **Step 1: 실패하는 테스트**

```ts
// __tests__/api/schedule-patch.test.ts
/** @jest-environment node */
import { PATCH } from '@/app/api/schedule/route';
import { prisma } from '@/lib/db';

jest.mock('@/lib/auth', () => ({ getAuthenticatedUserId: jest.fn() }));
jest.mock('@/lib/db', () => ({
  prisma: {
    scheduleEvent: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { getAuthenticatedUserId } from '@/lib/auth';
import { NextRequest } from 'next/server';

function req(id: string | null, body: unknown): NextRequest {
  const url = id ? `http://x/api/schedule?id=${id}` : 'http://x/api/schedule';
  return new NextRequest(url, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PATCH /api/schedule', () => {
  beforeEach(() => jest.clearAllMocks());

  it('미인증 → 401', async () => {
    (getAuthenticatedUserId as jest.Mock).mockResolvedValue(null);
    const res = await PATCH(req('evt1', { completed: true }));
    expect(res.status).toBe(401);
  });

  it('id 누락 → 400', async () => {
    (getAuthenticatedUserId as jest.Mock).mockResolvedValue('u1');
    const res = await PATCH(req(null, { completed: true }));
    expect(res.status).toBe(400);
  });

  it('소유자 아님 → 404', async () => {
    (getAuthenticatedUserId as jest.Mock).mockResolvedValue('u1');
    (prisma.scheduleEvent.findUnique as jest.Mock).mockResolvedValue({ id: 'evt1', userId: 'other' });
    const res = await PATCH(req('evt1', { completed: true }));
    expect(res.status).toBe(404);
  });

  it('completed=true → completedAt 세팅', async () => {
    (getAuthenticatedUserId as jest.Mock).mockResolvedValue('u1');
    (prisma.scheduleEvent.findUnique as jest.Mock).mockResolvedValue({ id: 'evt1', userId: 'u1' });
    (prisma.scheduleEvent.update as jest.Mock).mockResolvedValue({});
    const res = await PATCH(req('evt1', { completed: true }));
    expect(res.status).toBe(200);
    expect(prisma.scheduleEvent.update).toHaveBeenCalledWith({
      where: { id: 'evt1' },
      data: { completedAt: expect.any(Date) },
    });
  });

  it('completed=false → completedAt null', async () => {
    (getAuthenticatedUserId as jest.Mock).mockResolvedValue('u1');
    (prisma.scheduleEvent.findUnique as jest.Mock).mockResolvedValue({ id: 'evt1', userId: 'u1' });
    (prisma.scheduleEvent.update as jest.Mock).mockResolvedValue({});
    const res = await PATCH(req('evt1', { completed: false }));
    expect(res.status).toBe(200);
    expect(prisma.scheduleEvent.update).toHaveBeenCalledWith({
      where: { id: 'evt1' },
      data: { completedAt: null },
    });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest __tests__/api/schedule-patch.test.ts`
Expected: FAIL (PATCH export 없음)

- [ ] **Step 3: route.ts에 PATCH 핸들러 추가**

`app/api/schedule/route.ts` 파일 끝에 추가:

```ts
export async function PATCH(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing event id' }, { status: 400 });
  }
  const body = (await request.json()) as { completed?: unknown };
  const completed = body.completed === true;

  const event = await prisma.scheduleEvent.findUnique({ where: { id } });
  if (!event || event.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.scheduleEvent.update({
    where: { id },
    data: { completedAt: completed ? new Date() : null },
  });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx jest __tests__/api/schedule-patch.test.ts`
Expected: PASS (5건)

- [ ] **Step 5: GET 회귀 확인**

Run: `npx jest __tests__/api` (기존 schedule GET/POST/DELETE 테스트가 있다면)
Expected: 회귀 없음

- [ ] **Step 6: Lint·tsc**

Run: `npx eslint app/api/schedule/route.ts && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add app/api/schedule/route.ts __tests__/api/schedule-patch.test.ts
git commit -m "feat: PATCH /api/schedule 추가 (completedAt 토글)"
```

---

## Task 9: /api/batch/nightly 구현 (TDD)

**Files:**
- Create: `app/api/batch/nightly/route.ts`
- Test: `__tests__/batch/nightly.test.ts`
- Delete later: `app/api/batch/sync-policies/route.ts` (Task 11에서)

nightly는 기존 sync-policies 로직 + 신규 매칭 알림 적재. 테스트는 두 흐름을 mock 기반으로 커버.

- [ ] **Step 1: 실패하는 테스트 — 인증·신규 매칭**

```ts
// __tests__/batch/nightly.test.ts
/** @jest-environment node */
import { GET } from '@/app/api/batch/nightly/route';
import { prisma } from '@/lib/db';
import { fetchFromYouthApi } from '@/lib/youthApi';

jest.mock('@/lib/youthApi', () => ({ fetchFromYouthApi: jest.fn() }));
jest.mock('@/lib/db', () => ({
  prisma: {
    youthPolicy: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
    notification: { createMany: jest.fn() },
    $queryRaw: jest.fn(),
  },
}));
jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }));

import { NextRequest } from 'next/server';

const OLD_ENV = process.env;
beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...OLD_ENV, CRON_SECRET: 'test-secret' };
});
afterAll(() => { process.env = OLD_ENV; });

function cronReq(secret: string | null): NextRequest {
  const headers = new Headers();
  if (secret !== null) headers.set('authorization', `Bearer ${secret}`);
  return new NextRequest('http://x/api/batch/nightly', { headers });
}

describe('/api/batch/nightly auth', () => {
  it('CRON_SECRET 불일치 → 401', async () => {
    const res = await GET(cronReq('wrong'));
    expect(res.status).toBe(401);
  });

  it('Authorization 헤더 없음 → 401', async () => {
    const res = await GET(cronReq(null));
    expect(res.status).toBe(401);
  });
});

describe('/api/batch/nightly matching', () => {
  it('신규 정책 0건 → matched=0', async () => {
    (fetchFromYouthApi as jest.Mock).mockResolvedValue([]);
    (prisma.youthPolicy.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

    const res = await GET(cronReq('test-secret'));
    const body = await res.json();
    expect(body.matched).toBe(0);
    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });

  it('신규 정책 + 매칭 유저가 있으면 POLICY_MATCH 알림 생성', async () => {
    (fetchFromYouthApi as jest.Mock).mockResolvedValue([
      { id: 'P1', name: '서울 일자리', agency: 'S', mainCategory: '일자리', category: 'x',
        description: '서울 거주 청년 취업', zipCodes: '11000' },
    ]);
    // 기존 ID 없음 → 전체가 신규
    (prisma.youthPolicy.findMany as jest.Mock)
      .mockResolvedValueOnce([]) // 기존 existingIds 조회
      .mockResolvedValueOnce([   // 신규 정책 상세 조회
        { plcyNo: 'P1', name: '서울 일자리', agency: 'S', mainCategory: '일자리', category: 'x',
          description: '서울 거주 청년 취업', zipCodes: '11000' },
      ]);
    (prisma.youthPolicy.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
    (prisma.youthPolicy.createMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.youthPolicy.update as jest.Mock).mockResolvedValue({});
    (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([
      { userId: 'u1', answers: JSON.stringify({ need: ['employment'], region: '11' }) },
    ]);

    const res = await GET(cronReq('test-secret'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.matched).toBeGreaterThanOrEqual(1);
    expect(prisma.notification.createMany).toHaveBeenCalled();
    const call = (prisma.notification.createMany as jest.Mock).mock.calls[0][0];
    expect(call.skipDuplicates).toBe(true);
    expect(call.data[0]).toMatchObject({
      userId: 'u1',
      type: 'POLICY_MATCH',
      dedupeKey: expect.stringMatching(/^policy-new:u1:\d{4}-\d{2}-\d{2}$/),
    });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest __tests__/batch/nightly.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

```ts
// app/api/batch/nightly/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/db';
import { fetchFromYouthApi } from '@/lib/youthApi';
import { scoreAndFilterPrograms } from '@/lib/recommendUtils';
import { todayKstStart, kstDateKey } from '@/lib/dateKst';
import type { QuizAnswers, Recommendation } from '@/lib/quiz';

export const maxDuration = 300;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = req.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  if (authHeader.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const policies = await fetchFromYouthApi();
    if (policies.length === 0) {
      return NextResponse.json({ synced: 0, matched: 0 });
    }

    const incomingIds = policies.map((p) => p.id!);

    // 기존 ID 스냅샷 → 신규 ID 계산
    const existing = await prisma.youthPolicy.findMany({
      where: { plcyNo: { in: incomingIds } },
      select: { plcyNo: true },
    });
    const existingIdSet = new Set(existing.map((r) => r.plcyNo));
    const newIds = incomingIds.filter((id) => !existingIdSet.has(id));

    // 기존 sync 로직
    await prisma.youthPolicy.deleteMany({ where: { plcyNo: { notIn: incomingIds } } });
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
    await Promise.all(policies.map((p) =>
      prisma.youthPolicy.update({
        where: { plcyNo: p.id! },
        data: {
          name: p.name, agency: p.agency, mainCategory: p.mainCategory, category: p.category,
          description: p.description, supportContent: p.supportContent ?? null,
          applicationUrl: p.applicationUrl ?? null, region: p.region ?? null, zipCodes: p.zipCodes ?? null,
        },
      }).catch(() => null),
    ));
    revalidateTag('youth-policies', 'max');

    // 신규 매칭
    let matched = 0;
    if (newIds.length > 0) {
      const newPolicies = await prisma.youthPolicy.findMany({
        where: { plcyNo: { in: newIds } },
      });
      const usersWithQuiz = await prisma.$queryRaw<Array<{ userId: string; answers: string }>>`
        SELECT DISTINCT ON ("userId") "userId", "answers"
        FROM "UserQuizResult"
        ORDER BY "userId", "createdAt" DESC
      `;
      const today = kstDateKey(todayKstStart());
      const rows = usersWithQuiz.flatMap(({ userId, answers }) => {
        let parsed: QuizAnswers;
        try { parsed = JSON.parse(answers) as QuizAnswers; } catch { return []; }
        const hits = scoreAndFilterPrograms(newPolicies as unknown as Recommendation[], parsed, 2);
        if (hits.length === 0) return [];
        return [{
          userId,
          type: 'POLICY_MATCH' as const,
          title: `새 맞춤 정책 ${hits.length}건`,
          message: '회원님께 맞는 신규 정책이 등록되었어요. 눌러서 확인해보세요.',
          relatedId: null,
          dedupeKey: `policy-new:${userId}:${today}`,
        }];
      });
      if (rows.length > 0) {
        await prisma.notification.createMany({ data: rows, skipDuplicates: true });
        matched = rows.length;
      }
    }
    return NextResponse.json({ synced: incomingIds.length, matched });
  } catch (err) {
    console.error('[nightly]', err);
    return NextResponse.json({ error: 'nightly failed' }, { status: 500 });
  }
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx jest __tests__/batch/nightly.test.ts`
Expected: PASS (4건)

- [ ] **Step 5: Lint·tsc**

Run: `npx eslint app/api/batch/nightly/route.ts && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/api/batch/nightly/route.ts __tests__/batch/nightly.test.ts
git commit -m "feat: /api/batch/nightly 추가 (정책 sync + 신규 매칭 알림 적재)"
```

---

## Task 10: /api/batch/morning 구현 (TDD)

**Files:**
- Create: `app/api/batch/morning/route.ts`
- Test: `__tests__/batch/morning.test.ts`

morning은 D-3/D-1 알림 적재 + `pushedAt IS NULL` 알림을 Expo로 전송.

- [ ] **Step 1: 실패하는 테스트 — 인증 및 D-3/D-1 생성**

```ts
// __tests__/batch/morning.test.ts
/** @jest-environment node */
import { GET } from '@/app/api/batch/morning/route';
import { prisma } from '@/lib/db';
import { sendExpoPush } from '@/lib/expoPush';

jest.mock('@/lib/db', () => ({
  prisma: {
    scheduleEvent: { findMany: jest.fn() },
    application: { findMany: jest.fn() },
    notification: { createMany: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
    pushToken: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));
jest.mock('@/lib/expoPush', () => ({ sendExpoPush: jest.fn(), chunk: jest.requireActual('@/lib/expoPush').chunk }));

import { NextRequest } from 'next/server';

const OLD_ENV = process.env;
beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...OLD_ENV, CRON_SECRET: 'morning-secret' };
  jest.useFakeTimers().setSystemTime(new Date('2026-04-23T00:00:00.000Z'));
  (prisma.$transaction as jest.Mock).mockResolvedValue([]);
  (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 0 });
  (prisma.scheduleEvent.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.application.findMany as jest.Mock).mockResolvedValue([]);
});
afterEach(() => jest.useRealTimers());
afterAll(() => { process.env = OLD_ENV; });

function cronReq(secret: string | null): NextRequest {
  const h = new Headers();
  if (secret !== null) h.set('authorization', `Bearer ${secret}`);
  return new NextRequest('http://x/api/batch/morning', { headers: h });
}

describe('/api/batch/morning auth', () => {
  it('시크릿 불일치 → 401', async () => {
    const res = await GET(cronReq('wrong'));
    expect(res.status).toBe(401);
  });
});

describe('/api/batch/morning D-3/D-1 생성', () => {
  it('D-1 ScheduleEvent + 미완료 → SCHEDULE 알림 생성', async () => {
    (prisma.scheduleEvent.findMany as jest.Mock).mockResolvedValue([
      { id: 'e1', userId: 'u1', title: '카카오 면접', type: 'INTERVIEW',
        date: new Date('2026-04-24T05:00:00.000Z'), completedAt: null, application: null },
    ]);
    const res = await GET(cronReq('morning-secret'));
    expect(res.status).toBe(200);
    const call = (prisma.notification.createMany as jest.Mock).mock.calls[0][0];
    expect(call.data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        userId: 'u1', type: 'SCHEDULE', relatedId: 'e1',
        title: expect.stringContaining('D-1'),
        dedupeKey: 'schedule:e1:D-1',
      }),
    ]));
  });

  it('completedAt 설정된 이벤트는 스킵', async () => {
    (prisma.scheduleEvent.findMany as jest.Mock).mockResolvedValue([
      { id: 'e1', userId: 'u1', title: '코테', type: 'CODING_TEST',
        date: new Date('2026-04-24T05:00:00.000Z'), completedAt: new Date(), application: null },
    ]);
    await GET(cronReq('morning-secret'));
    const calls = (prisma.notification.createMany as jest.Mock).mock.calls;
    const scheduleData = calls.flatMap((c) => c[0].data.filter((r: any) => r.type === 'SCHEDULE'));
    expect(scheduleData).toEqual([]);
  });

  it('application.status가 INTERVIEW면 CODING_TEST 이벤트 스킵', async () => {
    (prisma.scheduleEvent.findMany as jest.Mock).mockResolvedValue([
      { id: 'e1', userId: 'u1', title: '코테', type: 'CODING_TEST',
        date: new Date('2026-04-24T05:00:00.000Z'), completedAt: null,
        application: { status: 'INTERVIEW' } },
    ]);
    await GET(cronReq('morning-secret'));
    const calls = (prisma.notification.createMany as jest.Mock).mock.calls;
    const scheduleData = calls.flatMap((c) => c[0].data.filter((r: any) => r.type === 'SCHEDULE'));
    expect(scheduleData).toEqual([]);
  });

  it('Application.deadline D-3 + PENDING → DEADLINE 알림', async () => {
    (prisma.application.findMany as jest.Mock).mockResolvedValue([
      { id: 'app1', userId: 'u2', companyName: '삼성',
        deadline: new Date('2026-04-26T05:00:00.000Z'), status: 'PENDING' },
    ]);
    await GET(cronReq('morning-secret'));
    const call = (prisma.notification.createMany as jest.Mock).mock.calls[0][0];
    expect(call.data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        userId: 'u2', type: 'DEADLINE', relatedId: 'app1',
        title: expect.stringContaining('D-3'),
        dedupeKey: 'app-deadline:app1:D-3',
      }),
    ]));
  });
});

describe('/api/batch/morning push dispatch', () => {
  it('pushedAt NULL 알림 + 토큰이 있으면 Expo 호출', async () => {
    (prisma.notification.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'n1', userId: 'u1', type: 'SCHEDULE', title: 'D-1 면접', message: '내일이에요', relatedId: 'e1',
        user: { pushTokens: [{ token: 'ExponentPushToken[x]' }] },
      },
    ]);
    (sendExpoPush as jest.Mock).mockResolvedValue([{ status: 'ok', id: 'tkt' }]);
    await GET(cronReq('morning-secret'));
    expect(sendExpoPush).toHaveBeenCalledWith([expect.objectContaining({
      to: 'ExponentPushToken[x]', title: 'D-1 면접',
    })]);
  });

  it('DeviceNotRegistered 토큰 삭제 + 알림 pushedAt 마킹', async () => {
    (prisma.notification.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'n1', userId: 'u1', type: 'SCHEDULE', title: 't', message: 'm', relatedId: null,
        user: { pushTokens: [{ token: 'ExponentPushToken[dead]' }] },
      },
    ]);
    (sendExpoPush as jest.Mock).mockResolvedValue([{ status: 'error', details: { error: 'DeviceNotRegistered' } }]);
    await GET(cronReq('morning-secret'));
    expect(prisma.$transaction).toHaveBeenCalled();
    const txArgs = (prisma.$transaction as jest.Mock).mock.calls[0][0];
    // 트랜잭션 내 호출 구성 검증은 구현에서 생성된 호출 배열 확인
    expect(Array.isArray(txArgs)).toBe(true);
  });

  it('푸시 토큰 없는 유저 → pushedAt만 마킹, fetch 호출 없음', async () => {
    (prisma.notification.findMany as jest.Mock).mockResolvedValue([
      { id: 'n2', userId: 'u3', type: 'DEADLINE', title: 't', message: 'm', relatedId: 'app',
        user: { pushTokens: [] } },
    ]);
    await GET(cronReq('morning-secret'));
    expect(sendExpoPush).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest __tests__/batch/morning.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

```ts
// app/api/batch/morning/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/db';
import { todayKstStart, addDays, isSameKstDay } from '@/lib/dateKst';
import { isEventCompleted } from '@/lib/scheduleCompletion';
import { sendExpoPush, chunk, type ExpoPushMessage, type ExpoPushTicket } from '@/lib/expoPush';

export const maxDuration = 300;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = req.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  if (authHeader.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = todayKstStart();
  const d1 = addDays(today, 1);
  const d3 = addDays(today, 3);
  const d1End = addDays(d1, 1);
  const d3End = addDays(d3, 1);

  const events = await prisma.scheduleEvent.findMany({
    where: {
      OR: [
        { date: { gte: d1, lt: d1End } },
        { date: { gte: d3, lt: d3End } },
      ],
    },
    include: { application: { select: { status: true } } },
  });

  const scheduleRows = events
    .filter((e) => !isEventCompleted(
      { completedAt: e.completedAt, type: e.type },
      e.application ? { status: e.application.status } : null,
    ))
    .map((e) => {
      const dMinus = isSameKstDay(e.date, d1) ? 1 : 3;
      return {
        userId: e.userId,
        type: 'SCHEDULE' as const,
        title: `D-${dMinus} ${e.title}`,
        message: `${e.date.toISOString().slice(0, 10)} 예정된 일정이에요.`,
        relatedId: e.id,
        dedupeKey: `schedule:${e.id}:D-${dMinus}`,
      };
    });

  const apps = await prisma.application.findMany({
    where: {
      deletedAt: null,
      status: 'PENDING',
      OR: [
        { deadline: { gte: d1, lt: d1End } },
        { deadline: { gte: d3, lt: d3End } },
      ],
    },
    select: { id: true, userId: true, companyName: true, deadline: true },
  });

  const deadlineRows = apps
    .filter((a) => a.deadline !== null)
    .map((a) => {
      const dMinus = isSameKstDay(a.deadline!, d1) ? 1 : 3;
      return {
        userId: a.userId!,
        type: 'DEADLINE' as const,
        title: `D-${dMinus} ${a.companyName} 서류 마감`,
        message: '지원서 마감이 임박했어요.',
        relatedId: a.id,
        dedupeKey: `app-deadline:${a.id}:D-${dMinus}`,
      };
    })
    .filter((r) => r.userId); // userId 없는 레거시 제외

  if (scheduleRows.length + deadlineRows.length > 0) {
    await prisma.notification.createMany({
      data: [...scheduleRows, ...deadlineRows],
      skipDuplicates: true,
    });
  }

  // 푸시 디스패치
  const pending = await prisma.notification.findMany({
    where: { pushedAt: null },
    include: { user: { include: { pushTokens: true } } },
  });

  type MessageWithMeta = ExpoPushMessage & { _notificationId: string };
  const messagesWithMeta: MessageWithMeta[] = [];
  const tokenlessIds: string[] = [];

  for (const n of pending) {
    const tokens = n.user.pushTokens;
    if (tokens.length === 0) {
      tokenlessIds.push(n.id);
      continue;
    }
    for (const t of tokens) {
      messagesWithMeta.push({
        _notificationId: n.id,
        to: t.token,
        title: n.title,
        body: n.message,
        data: { notificationId: n.id, type: n.type, relatedId: n.relatedId },
        sound: 'default',
      });
    }
  }

  // 알림별 결과 집계: {notificationId → { anyOk, allDeviceNotRegistered, anyTransientError }}
  type Agg = { anyOk: boolean; deviceNotRegCount: number; errorCount: number; total: number };
  const agg = new Map<string, Agg>();
  const deadTokens: string[] = [];

  if (messagesWithMeta.length > 0) {
    for (const batch of chunk(messagesWithMeta, 100)) {
      const tickets: ExpoPushTicket[] = await sendExpoPush(
        batch.map(({ _notificationId, ...m }) => m),
      );
      tickets.forEach((ticket, i) => {
        const nid = batch[i]._notificationId;
        const to = batch[i].to;
        const cur = agg.get(nid) ?? { anyOk: false, deviceNotRegCount: 0, errorCount: 0, total: 0 };
        cur.total += 1;
        if (ticket.status === 'ok') {
          cur.anyOk = true;
        } else {
          cur.errorCount += 1;
          if (ticket.details?.error === 'DeviceNotRegistered') {
            cur.deviceNotRegCount += 1;
            deadTokens.push(to);
          }
        }
        agg.set(nid, cur);
      });
    }
  }

  const markPushedIds: string[] = [...tokenlessIds];
  for (const [nid, a] of agg.entries()) {
    if (a.anyOk) markPushedIds.push(nid);
    else if (a.deviceNotRegCount === a.total) markPushedIds.push(nid);
    // 그 외(전이적 에러)는 pushedAt 미세팅 → 다음날 재시도
  }

  const txOps: any[] = [];
  if (markPushedIds.length > 0) {
    txOps.push(prisma.notification.updateMany({
      where: { id: { in: markPushedIds } },
      data: { pushedAt: new Date() },
    }));
  }
  if (deadTokens.length > 0) {
    txOps.push(prisma.pushToken.deleteMany({ where: { token: { in: deadTokens } } }));
  }
  if (txOps.length > 0) {
    await prisma.$transaction(txOps);
  }

  return NextResponse.json({
    created: scheduleRows.length + deadlineRows.length,
    pushed: markPushedIds.length,
    removedTokens: deadTokens.length,
  });
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx jest __tests__/batch/morning.test.ts`
Expected: PASS (7건)

- [ ] **Step 5: Lint·tsc**

Run: `npx eslint app/api/batch/morning/route.ts && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/api/batch/morning/route.ts __tests__/batch/morning.test.ts
git commit -m "feat: /api/batch/morning 추가 (D-3/D-1 알림 적재 + Expo 푸시 전송)"
```

---

## Task 11: 기존 sync-policies 라우트 제거

**Files:**
- Delete: `app/api/batch/sync-policies/route.ts`

- [ ] **Step 1: 파일 삭제**

```bash
git rm app/api/batch/sync-policies/route.ts
```

- [ ] **Step 2: 사이드 이펙트 체크**

```bash
grep -rn "sync-policies" . --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" | grep -v node_modules
```

Expected: `vercel.json`만 남음 (Task 12에서 교체 예정). 다른 참조 없음.

- [ ] **Step 3: tsc**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: sync-policies 라우트 제거 (nightly로 편입)"
```

---

## Task 12: vercel.json 크론 스케줄 교체

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: vercel.json 전체 교체**

```json
{
  "crons": [
    { "path": "/api/batch/nightly", "schedule": "0 17 * * *" },
    { "path": "/api/batch/morning", "schedule": "0 0 * * *" }
  ]
}
```

주석: UTC 17:00 = KST 02:00 (nightly), UTC 00:00 = KST 09:00 (morning).

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "chore: 크론을 nightly(KST 02:00)·morning(KST 09:00) 2개로 정정"
```

---

## Task 13: 알림 클릭 라우팅 업데이트

**Files:**
- Modify: `app/(tabs)/notifications/page.tsx`

- [ ] **Step 1: handleNotificationClick 스위치 문으로 교체**

기존 if-else를 다음과 같이 교체:

```tsx
function handleNotificationClick(notification: Notification) {
  if (!notification.isRead) {
    readMutation.mutate([notification.id]);
  }
  switch (notification.type) {
    case '신규 맞춤 정책':
      router.push('/programs');
      return;
    case '일정 알림':
      router.push('/schedule');
      return;
    case '마감 임박':
    case '상태 변경':
      if (notification.relatedId) {
        router.push(`/applications/${notification.relatedId}`);
      }
      return;
  }
}
```

- [ ] **Step 2: Lint·tsc**

Run: `npx eslint 'app/(tabs)/notifications/page.tsx' && npx tsc --noEmit`
Expected: PASS. Type narrowing이 exhaustive인지 확인 (4 케이스 모두).

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/notifications/page.tsx"
git commit -m "feat: 알림 클릭 시 타입별 라우팅 (POLICY_MATCH → /programs)"
```

---

## Task 14: 일정 페이지 완료 토글 UI

**Files:**
- Modify: `app/(schedule)/schedule/_components/types.ts`
- Modify: `app/(schedule)/schedule/_components/EventList.tsx`
- Modify: `app/(schedule)/schedule/_components/useSchedule.ts`
- Modify: `app/api/schedule/route.ts` (GET 응답에 completedAt 포함)

수동(`manual`) 이벤트에만 체크박스 노출. `auto`(Application.deadline 파생)는 Application status 변경으로 처리.

- [ ] **Step 1: 서버 GET 응답에 completedAt 포함**

`app/api/schedule/route.ts`의 GET 내 `manualEvents` 매핑에 `completedAt` 추가:

```ts
const manualEvents = scheduleEvents.map((event) => ({
  id: event.id,
  title: event.title,
  date: event.date.toISOString(),
  type: event.type,
  memo: event.memo,
  source: 'manual' as const,
  completedAt: event.completedAt?.toISOString() ?? null,
}));
```

- [ ] **Step 2: 프론트 타입에 completedAt 추가**

```ts
// app/(schedule)/schedule/_components/types.ts
export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  type: 'DEADLINE' | 'CODING_TEST' | 'INTERVIEW' | 'DOCUMENT' | 'OTHER';
  source: 'auto' | 'manual';
  memo?: string | null;
  status?: string;
  completedAt?: string | null; // 신규
}
```

- [ ] **Step 3: useSchedule.ts에 PATCH 뮤테이션 추가**

기존 삭제 뮤테이션과 유사하게 추가:

```ts
const patchMutation = useMutation({
  mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
    const res = await fetch(`/api/schedule?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    if (!res.ok) throw new Error('완료 상태 변경 실패');
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['schedule', year, month] });
  },
});
```

export 객체에 `togglComplete: patchMutation.mutate` 추가.

- [ ] **Step 4: EventList에 체크박스 UI**

EventListProps에 `onToggleComplete?: (id: string, completed: boolean) => void` 추가. 매핑부에서:

```tsx
{event.source === 'manual' && (
  <input
    type="checkbox"
    className="mt-1.5 shrink-0"
    checked={!!event.completedAt}
    onChange={(e) => onToggleComplete?.(event.id, e.target.checked)}
    aria-label="완료 처리"
  />
)}
```

완료된 아이템은 텍스트에 `line-through text-muted-foreground` 적용:

```tsx
<span className={cn(
  'font-medium text-sm',
  event.completedAt && 'line-through text-muted-foreground',
)}>
  {event.title}
</span>
```

(`cn` import 없으면 추가: `import { cn } from '@/lib/utils';`)

- [ ] **Step 5: page.tsx에서 onToggleComplete prop 연결**

`app/(schedule)/schedule/page.tsx`에서 `useSchedule` hook 결과의 `toggleComplete`를 `EventList`에 prop으로 전달.

- [ ] **Step 6: Lint·tsc**

Run: `npx eslint 'app/(schedule)/schedule' 'app/api/schedule/route.ts' && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 7: 수동 동작 확인**

Run: `npm run dev`
- `/schedule` 접속 → 수동 이벤트에 체크박스 노출 확인 → 체크 → 새로고침 시 상태 유지 → 취소선·회색 표시.
- `auto`(지원서 마감) 이벤트엔 체크박스 없음.

- [ ] **Step 8: Commit**

```bash
git add "app/(schedule)/schedule" app/api/schedule/route.ts
git commit -m "feat: 일정 페이지에 완료 토글 체크박스 추가 (수동 이벤트 한정)"
```

---

## Task 15: lib/notificationApi.ts에 registerPushToken 추가

**Files:**
- Modify: `lib/notificationApi.ts`

- [ ] **Step 1: 함수 추가**

파일 끝에:

```ts
export async function registerPushToken(info: { token: string; platform: 'ios' | 'android' }): Promise<void> {
  const res = await fetch('/api/push-tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(info),
  });
  if (!res.ok) throw new Error('푸시 토큰 등록 실패');
}
```

- [ ] **Step 2: 테스트 추가**

`__tests__/notifications/notificationApi.test.ts` (기존 파일)에 추가:

```ts
import { registerPushToken } from '@/lib/notificationApi';

describe('registerPushToken', () => {
  it('토큰을 POST로 등록한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true });
    await registerPushToken({ token: 'ExponentPushToken[x]', platform: 'ios' });
    expect(fetch).toHaveBeenCalledWith('/api/push-tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'ExponentPushToken[x]', platform: 'ios' }),
    });
  });
});
```

- [ ] **Step 3: 통과 확인**

Run: `npx jest __tests__/notifications`
Expected: PASS (기존 + 1건 신규)

- [ ] **Step 4: Commit**

```bash
git add lib/notificationApi.ts __tests__/notifications
git commit -m "feat: registerPushToken API 클라이언트 추가"
```

---

## Task 16: 웹 usePushTokenRegister 훅

**Files:**
- Create: `lib/usePushTokenRegister.ts`
- Modify: `app/providers.tsx`

- [ ] **Step 1: 훅 구현**

```ts
// lib/usePushTokenRegister.ts
'use client';
import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useIsApp } from './useIsApp';
import { registerPushToken } from './notificationApi';

declare global {
  interface Window {
    __PUSH_TOKEN__?: { token: string; platform: 'ios' | 'android' };
  }
}

export function usePushTokenRegister() {
  const isApp = useIsApp();
  const { data: session } = useSession();
  const registered = useRef(false);

  useEffect(() => {
    if (!isApp || !session?.user || registered.current) return;
    const info = window.__PUSH_TOKEN__;
    if (!info?.token) return;
    registered.current = true;
    registerPushToken(info).catch((err) => {
      console.error('[push-token-register]', err);
      registered.current = false;
    });
  }, [isApp, session]);
}
```

- [ ] **Step 2: providers.tsx에서 호출**

`app/providers.tsx`에 래퍼 컴포넌트 추가 또는 기존 최상위 클라이언트 컴포넌트에서 훅 호출. 예:

```tsx
'use client';
import { usePushTokenRegister } from '@/lib/usePushTokenRegister';

function PushTokenRegistration() {
  usePushTokenRegister();
  return null;
}

// Providers 내부 children 옆에 <PushTokenRegistration />
```

- [ ] **Step 3: Lint·tsc**

Run: `npx eslint lib/usePushTokenRegister.ts app/providers.tsx && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add lib/usePushTokenRegister.ts app/providers.tsx
git commit -m "feat: 웹 usePushTokenRegister 훅 + providers 통합"
```

---

## Task 17: 모바일 expo-notifications 의존성·훅

**Files:**
- Modify: `mobile/package.json`
- Modify: `mobile/app.json`
- Create: `mobile/hooks/usePushToken.ts`

- [ ] **Step 1: 의존성 설치**

```bash
cd mobile
npx expo install expo-notifications expo-device
cd ..
```

Expected: `expo-notifications`, `expo-device`가 `dependencies`에 추가됨.

- [ ] **Step 2: app.json plugins 확장**

```json
{
  "expo": {
    "name": "mobile",
    "slug": "mobile",
    "version": "1.0.0",
    "scheme": "for-youth",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.foryouth.app"
    },
    "android": {
      "package": "com.foryouth.app",
      "adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png", "backgroundColor": "#ffffff" },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false
    },
    "plugins": [
      "expo-router",
      ["expo-notifications", { "icon": "./assets/icon.png", "color": "#ffffff" }]
    ],
    "newArchEnabled": true,
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "icon": "./assets/icon.png",
    "splash": { "image": "./assets/splash-icon.png", "resizeMode": "contain", "backgroundColor": "#ffffff" },
    "web": { "favicon": "./assets/favicon.png" }
  }
}
```

주의: 실제 bundle ID·package 이름은 배포 정책에 맞게 `com.yourorg.foryouth` 형태로 확정. `com.foryouth.app`은 예시.

- [ ] **Step 3: usePushToken 훅 작성**

```ts
// mobile/hooks/usePushToken.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export async function registerPushToken(): Promise<{ token: string; platform: 'ios' | 'android' } | null> {
  if (!Device.isDevice) return null;
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
    ?? Constants.easConfig?.projectId;
  if (!projectId) return null;

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  return { token, platform };
}
```

- [ ] **Step 4: Lint 체크 (모바일은 ESLint 미설정일 수 있음 → tsc만)**

Run: `cd mobile && npx tsc --noEmit && cd ..`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mobile/package.json mobile/app.json mobile/package-lock.json mobile/hooks/usePushToken.ts
git commit -m "feat(mobile): expo-notifications 의존성 + 토큰 획득 훅"
```

---

## Task 18: 모바일 TabWebView에 토큰 주입

**Files:**
- Modify: `mobile/components/TabWebView.tsx`

- [ ] **Step 1: 토큰 상태·주입 로직 추가**

컴포넌트 상단:

```tsx
import { useEffect, useState } from 'react';
import { registerPushToken } from '@/hooks/usePushToken';

// 컴포넌트 내부
const [pushInfo, setPushInfo] = useState<{ token: string; platform: string } | null>(null);
useEffect(() => {
  registerPushToken().then(setPushInfo).catch(() => {});
}, []);

const injectedJS = pushInfo
  ? `window.__PUSH_TOKEN__ = ${JSON.stringify(pushInfo)}; true;`
  : '';
```

WebView props에 추가 또는 기존 `injectedJavaScriptBeforeContentLoaded`에 합치기:

```tsx
<WebView
  ...
  injectedJavaScriptBeforeContentLoaded={injectedJS}
/>
```

- [ ] **Step 2: 알림 핸들러 설정 (최상위 layout 초기화)**

`mobile/app/_layout.tsx`에 추가:

```tsx
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});
```

- [ ] **Step 3: tsc**

Run: `cd mobile && npx tsc --noEmit && cd ..`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add "mobile/components/TabWebView.tsx" mobile/app/_layout.tsx
git commit -m "feat(mobile): WebView에 __PUSH_TOKEN__ 주입 + 포그라운드 알림 배너"
```

---

## Task 19: 최종 검증 — lint·tsc·jest·수동 테스트

- [ ] **Step 1: 전체 lint**

Run: `npx eslint .`
Expected: PASS (warnings 허용, errors 없어야 함)

- [ ] **Step 2: 전체 tsc**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: 전체 jest**

Run: `npm test`
Expected: 전부 PASS

- [ ] **Step 4: 수동 크론 호출 (dev)**

```bash
export CRON_SECRET=local-secret  # .env.local에 설정한 값
npm run dev
curl -H "Authorization: Bearer local-secret" http://localhost:3000/api/batch/nightly
curl -H "Authorization: Bearer local-secret" http://localhost:3000/api/batch/morning
```

Expected:
- nightly: `{"synced": N, "matched": M}` 형식 응답
- morning: `{"created": X, "pushed": Y, "removedTokens": Z}` 형식 응답
- 401 응답: 시크릿 없이 호출하면 `Unauthorized`

- [ ] **Step 5: 웹 UI 확인**

- `/notifications` 접속 → 생성된 알림 표시 확인.
- 각 알림 클릭 → 타입별 라우팅 (POLICY_MATCH → /programs, SCHEDULE → /schedule, DEADLINE → /applications/...).
- `/schedule` 이벤트 체크박스 클릭 → 상태 유지.

- [ ] **Step 6: Commit (없으면 생략)**

위 단계에서 수정한 게 없다면 커밋 불필요.

---

## 참고 리소스

- Expo Push API: https://docs.expo.dev/push-notifications/sending-notifications/
- Expo Notifications SDK: https://docs.expo.dev/versions/latest/sdk/notifications/
- Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
- 프로젝트 `docs/claude/nextjs.md` (API 라우트 작성 규약)
- 프로젝트 `docs/claude/hooks.md` (React 훅 작성 규약)
- 프로젝트 `docs/claude/testing.md` (테스트 가이드)

---

## 후속 과제 (이번 범위 외)

- EAS Build 구성 (`eas build:configure`) — 실기기 푸시 테스트에 필요
- 마이페이지 알림 on/off 설정 UI
- "신규 매칭만 보기" 필터 페이지 `/programs?filter=new`
- 푸시 receipt polling (전송 성공률 모니터링)
- 유저 수 증가 시 배치 분할/워커화
