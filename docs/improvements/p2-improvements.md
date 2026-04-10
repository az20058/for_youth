# P2 개선 사항

> 작업일: 2026-04-11
> 커밋: `a106f4e`, `e7ed9ea`, `a2609b6`

---

## P2-3: React Query staleTime 증가

### 문제
`app/providers.tsx`의 전역 staleTime이 60초였다. 청년 정책 목록처럼 하루에 한 번 갱신되는 데이터에도 1분마다 서버 재요청이 발생했다.

### 변경 내용

**파일:** `app/providers.tsx`

```ts
// 이전
staleTime: 60 * 1000

// 이후
staleTime: 5 * 60 * 1000
```

**효과:**
- API 요청 횟수 최대 5배 감소
- 페이지 전환 시 캐시 히트율 향상 → 체감 응답 속도 개선
- Vercel 서버리스 함수 호출 비용 절감

---

## P2-2: 만료 정책 정리

P1-2에서 배치 싱크를 `deleteMany({ where: { plcyNo: { notIn: incomingIds } } })`로 변경했다.
`fetchFromYouthApi`가 이미 `isActive()` 필터로 만료 정책을 제외하므로, 배치 싱크 실행 시 만료된 정책이 자동으로 DB에서 제거된다.
별도 정리 잡 없이 P1-2로 충족됐다.

---

## P2-1: Application 소프트 딜리트

### 문제
지원서 삭제 시 `prisma.application.delete()`로 DB에서 완전 삭제됐다. 연결된 자기소개서도 cascade로 함께 삭제되어 복구 방법이 없었다.

### 변경 내용

**파일:**
- `prisma/schema.prisma`
- `prisma/migrations/20260411004024_soft_delete/`
- `app/api/applications/route.ts`
- `app/api/applications/[id]/route.ts`
- `app/api/applications/[id]/company-summary/route.ts`
- `app/api/schedule/route.ts`

**스키마 변경:**
```prisma
model Application {
  ...
  deletedAt    DateTime?   // 추가
  ...
}
```

**DELETE 동작 변경:**
```ts
// 이전: 실제 삭제
await prisma.application.delete({ where: { id } });

// 이후: 소프트 딜리트
await prisma.application.update({
  where: { id },
  data: { deletedAt: new Date() },
});
```

**모든 조회에 `deletedAt: null` 조건 추가:**

| 파일 | 변경된 쿼리 |
|------|------------|
| `applications/route.ts` | GET의 findMany |
| `applications/[id]/route.ts` | findApp의 findFirst |
| `applications/[id]/company-summary/route.ts` | findFirst |
| `schedule/route.ts` | 마감일 조회의 findMany |

**효과:**
- 실수로 삭제한 지원서 복구 가능 (DB 직접 접근으로 `deletedAt = NULL` 업데이트)
- 삭제된 지원서의 자기소개서 데이터도 보존
- 향후 "삭제된 지원서 복원" UI 기능 추가 가능

---

## P2-5: 퀴즈 결과 DB 저장

### 문제
퀴즈 결과가 Zustand + localStorage에만 저장됐다. 기기 변경 또는 브라우저 캐시 초기화 시 추천 이력이 소멸하고, 서버에서 사용자별 추천 데이터를 분석할 방법이 없었다.

### 변경 내용

**파일:**
- `prisma/schema.prisma` — `UserQuizResult` 모델 추가
- `prisma/migrations/20260411004224_add_quiz_result/`
- `app/api/quiz/result/route.ts` — 저장 API 신설
- `app/quiz/_components/QuizFlow.tsx` — 로그인 시 서버 저장 호출

**신규 스키마:**
```prisma
model UserQuizResult {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  answers         String   @db.Text   // QuizAnswers JSON
  recommendations String   @db.Text   // Recommendation[] JSON
  createdAt       DateTime @default(now())

  @@index([userId])
}
```

**QuizFlow 저장 방식:**
- localStorage 저장은 그대로 유지 (비로그인 사용자 호환)
- 로그인 사용자일 때만 `/api/quiz/result`에 추가 저장
- fire-and-forget (`await` 없이) — 실패해도 사용자 경험 영향 없음

```ts
if (session?.user) {
  fetch("/api/quiz/result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers, recommendations: data.recommendations }),
  }).catch(() => null);
}
```

**효과:**
- 로그인 사용자는 기기를 바꿔도 서버에서 이전 추천 이력 조회 가능 (UI는 추후 구현)
- 어떤 조건으로 어떤 정책이 많이 추천됐는지 서버 분석 가능
- 비로그인 사용자 경험 변화 없음

---

## 마이그레이션 적용 방법

`.env` 파일(Neon DB 접속 정보) 설정 후:

```bash
node_modules/.bin/prisma migrate deploy
```
