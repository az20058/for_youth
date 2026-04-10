# P1 개선 사항

> 작업일: 2026-04-10
> 커밋: `c31ac86`, `b50aec8`, `5945c27`

---

## P1-3: DB 인덱스 추가

### 문제
`schema.prisma`에 인덱스가 전혀 없었다. 데이터가 쌓일수록 자주 사용되는 필터 조회가 풀 스캔으로 동작해 성능이 선형으로 저하될 구조였다.

### 변경 내용

**파일:** `prisma/schema.prisma`, `prisma/migrations/20260410233836_add_indexes/`

| 모델 | 추가된 인덱스 | 이유 |
|------|--------------|------|
| `Application` | `[userId]` | 지원 목록 조회 (가장 빈번) |
| `Application` | `[userId, status]` | 상태별 필터링 |
| `Application` | `[deadline]` | 마감일 정렬/조회 |
| `ScheduleEvent` | `[userId]` | 일정 목록 조회 |
| `YouthPolicy` | `[region]` | 지역 필터 |
| `YouthPolicy` | `[mainCategory]` | 카테고리 필터 |

### 적용 방법
`.env` 파일이 없어 `prisma migrate dev`를 직접 실행할 수 없었다. 마이그레이션 SQL을 수동으로 작성하고 `prisma generate`로 클라이언트만 재생성했다. 실제 DB 적용은 `node_modules/.bin/prisma migrate deploy`로 진행한다.

---

## P1-2: 배치 싱크 upsert 방식 전환

### 문제
`api/batch/sync-policies/route.ts`에서 `deleteMany()` + `createMany()`를 단일 트랜잭션으로 묶었다. 트랜잭션 실행 중 `YouthPolicy` 테이블이 완전히 비어 있는 구간이 발생해 동시 접속 사용자가 빈 화면을 볼 수 있었다. 또한 만료/제거된 정책과 유효한 정책을 구분하지 않고 전체를 삭제해 필요 이상의 DB 부하가 발생했다.

### 변경 내용

**파일:** `app/api/batch/sync-policies/route.ts`

**이전 방식:**
```
1. deleteMany() — 전체 삭제 (데이터 공백 발생)
2. createMany() — 전체 재삽입
(트랜잭션으로 묶임)
```

**이후 방식:**
```
1. deleteMany({ where: { plcyNo: { notIn: incomingIds } } })
   — API 응답에 없는 정책(만료/제거된 것)만 삭제
2. createMany({ skipDuplicates: true })
   — 신규 정책만 삽입, 기존 데이터 유지
3. Promise.all(update(...))
   — 기존 정책 필드 갱신 (viewCount는 덮어쓰지 않음)
```

**효과:**
- 싱크 중 데이터 공백 제거
- 실제로 변경/추가된 정책만 처리
- `viewCount`(사용자 조회수)를 API 싱크가 덮어쓰지 않음

---

## P1-1: CompanySummary 공유 캐시 전환

### 문제
`CompanySummary` 모델이 `applicationId`를 FK로 가졌다. 동일 기업(예: 카카오)에 A 유저와 B 유저가 각각 지원하면 Claude Haiku API 호출이 각각 발생하고, DB에도 동일한 내용이 두 번 저장됐다. 사용자가 늘어날수록 Claude API 비용이 불필요하게 증가하는 구조였다.

### 변경 내용

**파일:**
- `prisma/schema.prisma`
- `prisma/migrations/20260410234601_shared_company_summary/`
- `app/api/applications/[id]/company-summary/route.ts`

**스키마 변경:**

이전:
```prisma
model CompanySummary {
  applicationId String      @unique   // applicationId가 키
  application   Application @relation(...)
  ...
}
```

이후:
```prisma
model CompanySummary {
  companyName String @unique   // 기업명이 키 (전체 사용자 공유)
  ...
}
```

**API route 변경:**

| 항목 | 이전 | 이후 |
|------|------|------|
| 캐시 조회 키 | `applicationId` (지원서 단위) | `companyName` (기업 단위) |
| 캐시 공유 범위 | 지원서 1개 | 동일 기업명의 모든 지원서 |
| upsert 키 | `applicationId` | `companyName` |

**normalizeCompanyName 함수 추가:**
```ts
function normalizeCompanyName(name: string): string {
  return name.trim();
}
```
앞뒤 공백을 제거해 "카카오"와 " 카카오"가 동일 캐시를 바라보도록 처리했다.

**효과:**
- 동일 기업의 첫 번째 조회 이후 Claude API 호출 없음
- DB 중복 레코드 제거
- 인기 기업(대기업 등) 조회 시 비용 절감 효과 극대화

---

## 마이그레이션 적용 방법

`.env` 파일(Neon DB 접속 정보)이 필요하다.

```bash
# .env 설정 후
node_modules/.bin/prisma migrate deploy
```
