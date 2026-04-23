# 알림 시스템 설계 (신규 정책 매칭 · 일정 D-3/D-1)

- 작성일: 2026-04-23
- 범위: 웹 인앱 알림 + Expo 푸시 알림 (모바일 앱)
- 전제: `Notification` 모델, `/notifications` 페이지, 벨 UI는 이미 존재. 본 작업은 **알림 생성 로직과 전송 경로**를 추가.

## 1. 목표

1. 사용자 정보에 맞는 **신규 정책**이 등록되면 알림.
2. 사용자가 등록한 **일정 또는 지원서 마감일**이 **D-3, D-1**일 때 알림.
3. 웹에선 인앱 벨/리스트에만 누적, **모바일 앱에선 푸시 알림** 전송.

## 2. 비목표 (v1 범위 밖)

- 유저별 알림 on/off 설정 UI
- "최근 신규 매칭만 보기" 필터 페이지
- 이메일 알림
- 푸시 receipt polling (전송 성공 여부 상세 추적)

## 3. 아키텍처 개요

```
02:00 KST  nightly   /api/batch/nightly
  └─ 1) 기존 sync-policies 로직 (정책 upsert)
  └─ 2) 오늘 신규 정책 × 퀴즈 완료 유저 스코어링 → Notification 적재

09:00 KST  morning   /api/batch/morning
  └─ 1) D-3, D-1 일정·지원서 마감 스캔 → Notification 적재
  └─ 2) pushedAt IS NULL 알림 Expo Push로 일괄 전송
```

**Vercel 크론 2개로 운영** (Hobby 플랜 한도 내). 생성 로직과 전송 로직을 분리해, Expo 장애에도 웹 알림은 누락되지 않는다.

## 4. 데이터 모델 변경

```prisma
enum NotificationType {
  DEADLINE
  SCHEDULE
  STATUS_CHANGE
  POLICY_MATCH           // 신규
}

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

  dedupeKey String?          @unique     // 신규
  pushedAt  DateTime?                    // 신규

  @@index([userId])
  @@index([userId, isRead])
  @@index([pushedAt])                    // 신규: 미전송분 스캔
}

model ScheduleEvent {
  // ... 기존 필드 ...
  completedAt DateTime?                  // 신규
}

model PushToken {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token      String   @unique            // "ExponentPushToken[...]"
  platform   String                      // "ios" | "android"
  lastSeenAt DateTime @default(now())
  createdAt  DateTime @default(now())

  @@index([userId])
}

model User {
  // ... 기존 ...
  pushTokens PushToken[]                 // 신규 관계
}
```

**마이그레이션 주의**
- `dedupeKey @unique`는 Nullable. Postgres는 NULL 여러 개가 UNIQUE 제약을 위반하지 않음.
- `pushedAt` 마이그레이션 직후 기존 알림이 재전송되지 않도록 **`UPDATE Notification SET pushedAt = createdAt WHERE pushedAt IS NULL`** 1회 실행.
- `enum` 값 추가는 Postgres `ALTER TYPE ... ADD VALUE`로 Prisma가 자동 생성.

## 5. 매칭·생성 로직

### 5-1. 정책 매칭 (nightly)

- 신규 정책 = `incomingIds - existingIds` (sync-policies 내부에서 계산, createMany 결과 활용).
- 유저별 **최신 `UserQuizResult`** 1건 조회 (`DISTINCT ON (userId) ... ORDER BY createdAt DESC`).
- 각 유저마다 `scoreAndRankPrograms(newPolicies, answers)` 실행. **score ≥ 2**인 매칭만 카운트.
- `matches.length ≥ 1`이면 `POLICY_MATCH` 알림 1건 생성 (묶음 방식 — 개수만 노출).
- 퀴즈 미완료 유저는 스킵.
- `dedupeKey = policy-new:{userId}:{YYYY-MM-DD}` (유저당 하루 1건 보장).

**내부 수정**
- `lib/recommendUtils.ts::scoreAndRankPrograms`가 score를 반환하지 않음 → score를 포함한 변형 함수를 추가 export (예: `scoreAndFilterPrograms(policies, answers, minScore)`).

### 5-2. 일정 D-3/D-1 (morning)

- KST 기준 오늘 00:00을 기준으로 `D+1`, `D+3` 날짜 범위 계산.
- `ScheduleEvent` 스캔 조건:
  - `date ∈ [D+1, D+1+1일)` 또는 `date ∈ [D+3, D+3+1일)`
  - `completedAt IS NULL`
  - `applicationId`가 있으면 연결된 application 포함해서 조회 → 아래 **상태 기반 skip** 적용.
- `Application.deadline` 스캔 조건:
  - `deadline ∈ [D+1, ...)` 또는 `[D+3, ...)`
  - `deletedAt IS NULL`
  - **`status = PENDING`만** (이미 지원/탈락한 건은 제외).

**상태 기반 skip (`ScheduleEvent`)**

| 이벤트 타입 | skip 조건 (연결된 `Application.status`) |
|---|---|
| `CODING_TEST` | `INTERVIEW`, `APPLIED`, `ACCEPTED`, `REJECTED_*` |
| `INTERVIEW` | `APPLIED`, `ACCEPTED`, `REJECTED_*` |
| `DOCUMENT` | `status != PENDING` 전체 |
| `OTHER` | skip 없음 (`completedAt`만으로 판정) |

**dedupeKey**
- `ScheduleEvent`: `schedule:{eventId}:D-{1|3}`
- `Application.deadline`: `app-deadline:{appId}:D-{1|3}`

**알림 본문 예시**

| type | title | message |
|---|---|---|
| POLICY_MATCH | `새 맞춤 정책 3건` | `회원님께 맞는 신규 정책이 등록되었어요. 눌러서 확인해보세요.` |
| SCHEDULE | `D-3 카카오 최종 면접` | `2026-04-26 예정된 일정이에요.` |
| DEADLINE | `D-1 삼성전자 서류 마감` | `지원서 마감이 임박했어요.` |

### 5-3. 푸시 전송 (morning 내부)

1. `Notification where pushedAt IS NULL` 조회 (마이그레이션 이후 생성분만 자연스럽게 대상).
2. 각 알림의 `userId`로 `PushToken` 로드.
3. 토큰 있는 건: Expo Push API(`POST https://exp.host/--/api/v2/push/send`)에 **100건/배치**로 전송.
   - payload: `{ to, title, body, data: { notificationId, type, relatedId }, sound: 'default' }`
4. 토큰 없는 유저(웹 전용): `pushedAt = now()` 마킹만 하고 재시도 대상에서 제외.
5. 응답 처리 (알림 1건은 기기 수만큼 메시지로 분산됨 → 알림 단위 집계):
   - 메시지 중 **하나라도 `status: 'ok'`** → 해당 `Notification.pushedAt = now()`.
   - 모두 에러이고 **모두 `DeviceNotRegistered`** → 해당 토큰들 삭제, 알림도 `pushedAt` 마킹(재시도 대상 소멸).
   - 모두 에러이지만 **전이적 실패(네트워크, 5xx 등) 포함** → `pushedAt` 미세팅 → 다음날 재시도.

**배치 중 인덱스 매핑**: `messages[i] ↔ notificationId`는 별도 `Map<tokenPlusNotificationId, notificationId>`로 유지 (flatMap 인덱스 의존 금지).

## 6. 크론·시간대

`vercel.json`:
```json
{
  "crons": [
    { "path": "/api/batch/nightly", "schedule": "0 17 * * *" },   // UTC 17:00 = KST 02:00
    { "path": "/api/batch/morning", "schedule": "0 0 * * *" }     // UTC 00:00 = KST 09:00
  ]
}
```

**주의**: 현재 `sync-policies`의 `"0 2 * * *"`는 UTC 02:00 = KST 11:00로 **의도와 다르게 동작하고 있음**. nightly 통합 과정에서 이 값도 올바른 시간(UTC 17:00)으로 정정.

인증은 기존 `CRON_SECRET` timing-safe Bearer 검증 패턴 재사용.

## 7. 모바일 앱 연동

### 7-1. 의존성

```
mobile/package.json
  + expo-notifications (~0.32)
  + expo-device (~7)
```

### 7-2. EAS 설정

- `mobile/app.json`에 `bundleIdentifier`, `package`, `plugins`에 `expo-notifications` 추가.
- `eas build:configure` 1회 → `projectId` 할당.
- Android: FCM 자격(`google-services.json`)은 **EAS Secrets**로 관리, 레포 커밋 금지.

### 7-3. 토큰 획득·주입 (WebView 브릿지)

- `mobile/hooks/usePushToken.ts`에서 `Notifications.requestPermissionsAsync` → `getExpoPushTokenAsync({ projectId })`.
- 시뮬레이터는 `Device.isDevice === false`로 skip.
- `mobile/components/TabWebView.tsx`: WebView 로드 전 `injectedJavaScriptBeforeContentLoaded`로 `window.__PUSH_TOKEN__ = { token, platform }` 주입.
- 웹 측 `lib/usePushTokenRegister.ts` 훅이 로그인 세션 있으면 `POST /api/push-tokens`로 등록.

### 7-4. 포그라운드 수신·딥링크

- `Notifications.setNotificationHandler`로 앱 열린 상태에서도 배너 표시.
- 탭 시 `response.notification.request.content.data.url` → WebView에 `postMessage`로 전달 → 웹이 `router.push`.

## 8. API 변경·추가

| 메서드 | 경로 | 용도 | 신규/변경 |
|---|---|---|---|
| POST | `/api/push-tokens` | Expo 토큰 upsert (token 기준) | 신규 |
| PATCH | `/api/schedule?id=...` | `ScheduleEvent.completedAt` 토글 (body: `{ completed: boolean }`) | 신규 |
| GET | `/api/batch/nightly` | 정책 동기화 + 신규 매칭 알림 적재 (기존 sync-policies 로직 흡수) | 신규 |
| — | `/api/batch/sync-policies` | nightly로 편입, 파일 삭제 | 제거 |
| GET | `/api/batch/morning` | D-3/D-1 + 푸시 전송 | 신규 |

기존 알림 조회/읽음 API(`/api/notifications`, `/api/notifications/read`, `/api/notifications/unread-count`)는 변경 없음.

## 9. 웹 UI 변경

### 9-1. 알림 클릭 라우팅 (`app/(tabs)/notifications/page.tsx`)

```ts
switch (n.type) {
  case '신규 맞춤 정책': router.push('/programs'); break;
  case '일정 알림':     router.push('/schedule'); break;
  case '마감 임박':
  case '상태 변경':     if (n.relatedId) router.push(`/applications/${n.relatedId}`); break;
}
```

### 9-2. 일정 완료 토글

- `/schedule` 리스트 아이템에 체크박스 추가.
- 체크 시 `PATCH /api/schedule?id=...` body `{ completed: true }`.
- 완료 아이템은 흐리게·취소선 표시.

### 9-3. 타입·맵 보강

- `lib/enumMaps.ts::NOTIFICATION_TYPE_FROM_DB`에 `POLICY_MATCH: '신규 맞춤 정책'` 추가.
- `lib/types.ts::NotificationType` 유니온에 `'신규 맞춤 정책'` 추가.
- `lib/notificationApi.ts`에 `registerPushToken({ token, platform })` 추가.

## 10. 에러 처리·엣지 케이스

| 케이스 | 처리 |
|---|---|
| 크론 재시도·중복 실행 | `dedupeKey` + `createMany({ skipDuplicates: true })` |
| Expo Push API 장애 | `pushedAt` 미세팅 → 다음날 크론에서 재전송 |
| 앱 삭제/토큰 만료 | `DeviceNotRegistered` 응답 → 해당 `PushToken` 삭제 |
| 유저가 여러 기기 사용 | `PushToken` 다건 보유, 각 토큰으로 개별 전송 |
| 퀴즈 미완료 유저 | 정책 매칭 스킵 (알림 미생성) |
| 당일 등록된 일정 | D-3/D-1 시점이 이미 지났으면 스킵 (정상) |
| 일정/지원서 deadline이 NULL | WHERE 조건에서 자연 제외 |
| 과거 알림 재전송 방지 | 마이그레이션 시 `pushedAt = createdAt`로 모두 마킹 |

## 11. 성능·스케일 고려

- 정책 매칭: O(users × newPolicies). 퀴즈 완료 유저 수가 수천 이하면 Hobby 60초 내 처리 가능.
- 푸시 배치: Expo는 100건/콜 제한, 유저 수천 × 평균 1.x 토큰 정도면 수십 번 호출로 완료.
- 병목 신호: nightly가 60초 근접 → Pro 전환 또는 워커 분리 과제로 격상.

## 12. 테스트 전략

**유닛 (Jest)**
- `scoreAndFilterPrograms` 임계치 2 경계 케이스.
- `lib/dateKst.ts` KST 경계·윤년·월말.
- `isEventCompleted(event, application)` 상태 × 이벤트 타입 매트릭스.
- 알림 title/message 포맷터.

**통합**
- `/api/batch/nightly` 인증 실패 → 401.
- 신규 정책 0건 → Notification 0건.
- 동일 크론 2회 → dedupeKey로 1건만 유지.
- `/api/batch/morning` D-3·D-1 혼합 + `completedAt` 설정 건 skip.
- `/api/push-tokens` 유효/무효 토큰 포맷.

**E2E (Playwright)**
- 벨 배지 증가 → 알림 클릭 → 타입별 라우팅 (`/programs`, `/schedule`, `/applications/...`).
- 일정 완료 체크 후 Prisma 직접 setup + 크론 엔드포인트 호출 → 해당 이벤트 알림 미생성 검증.

## 13. 오픈 이슈

- **`mobile`이 EAS 미설정 상태**: `projectId`, bundle ID, Android `package` 이름 결정 필요. 본 작업 일부 또는 별도 작업으로 분리.
- **FCM `google-services.json`**: 실제 빌드 시점에 구성. 로컬 개발에선 dev-client 기반 테스트.
