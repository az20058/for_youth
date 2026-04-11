# P3 개선 사항 (즉시 처리 항목)

> 작업일: 2026-04-11
> 커밋: `1e9bb89`, `2f99994`, `22bb1f5`

---

## P3-4: openai 패키지 제거

### 문제
`package.json`에 `openai` 패키지가 있었으나 코드 어디에서도 사용되지 않았다.
불필요한 번들 크기 증가와 코드베이스 혼란을 유발하고, 실수로 OpenAI를 사용하게 될 여지를 만들었다.

### 변경 내용

```bash
npm uninstall openai
```

**효과:**
- `node_modules`에서 openai 패키지 제거
- `package.json` / `package-lock.json` 정리
- 의존성 58개 항목 감소

---

## P3-3: 하드코딩 폴백 정책 제거

### 문제
`lib/youthApi.ts`에서 외부 API 장애 또는 API 키 미설정 시 `ALL_PROGRAMS`(8개 하드코딩 정책)를 반환했다.
이 데이터는 최신 상태가 보장되지 않으며, 사용자는 이를 실시간 정보로 오해할 수 있었다.

### 변경 내용

**파일:** `lib/youthApi.ts`

모든 `return ALL_PROGRAMS` 경로를 `return []`로 교체:

| 위치 | 이전 | 이후 |
|------|------|------|
| API 키 없을 때 | `return ALL_PROGRAMS` | `return []` |
| API 응답 실패 시 | `return ALL_PROGRAMS` | `return []` |
| totCount === 0 시 | `return ALL_PROGRAMS` | `return []` |
| catch 블록 | `return ALL_PROGRAMS` | `return []` |

`import { ALL_PROGRAMS }` 제거.

**효과:**
- API/DB 장애 시 잘못된 정보 대신 빈 화면 표시 → 사용자가 장애 상황을 명확히 인식 가능
- 배치 싱크 실패 시 하드코딩 데이터가 DB에 삽입되는 사고 방지
- `recommendUtils.ts`의 `ALL_PROGRAMS`는 코드에 남아 있으나 더 이상 runtime에서 사용되지 않음

---

## P3-2: ScheduleEvent ↔ Application 연결

### 문제
`ScheduleEvent`가 `Application`과 아무 연결도 없었다.
"카카오 면접" 일정이 어떤 지원서와 연관된 것인지 데이터 레벨에서 추적 불가능했다.
마감일 이벤트는 Application에서 자동 생성되지만, 코딩테스트·면접 등 수동 일정은 연결이 단절됐다.

### 변경 내용

**파일:**
- `prisma/schema.prisma`
- `prisma/migrations/20260411124610_schedule_application_link/`
- `app/api/schedule/route.ts`

**스키마 변경:**
```prisma
model ScheduleEvent {
  ...
  applicationId String?
  application   Application? @relation(fields: [applicationId], references: [id], onDelete: SetNull)
  ...
}

model Application {
  ...
  scheduleEvents ScheduleEvent[]
  ...
}
```

- `onDelete: SetNull` — 지원서가 소프트 딜리트되더라도 일정 데이터는 유지
- 옵셔널 필드이므로 기존 데이터 변경 없음

**API route 변경:**
POST `/api/schedule` 에서 `applicationId`를 선택적으로 수신:
```ts
const { title, date, type, memo, applicationId } = body;
// ...
applicationId: applicationId || null,
```

**현재 상태:** 데이터 모델만 연결, UI에서 일정 추가 시 applicationId를 선택하는 기능은 추후 구현.

**효과:**
- 일정-지원서 간 연결 데이터 저장 가능
- 향후 "이 지원서의 관련 일정" 표시 기능 추가 시 스키마 변경 불필요
- 지원서 삭제(소프트 딜리트) 시 관련 일정은 자동으로 applicationId = NULL 처리

---

## 미처리 P3 항목

| 항목 | 이유 |
|------|------|
| P3-5: Sentry 에러 트래킹 | 외부 서비스 연동 필요. 사용자 수 증가 후 도입 권장 |
| P3-6: API Rate Limiting | Upstash Redis 필요. Claude API 비용 우려 시점에 도입 |
| P3-1: 자소서-지원서 구조 개선 | XL 공수, 기존 데이터 마이그레이션 리스크. 사용자 피드백 후 결정 |

---

## 마이그레이션 적용 방법

`.env` 파일(Neon DB 접속 정보) 설정 후:

```bash
node_modules/.bin/prisma migrate deploy
```
