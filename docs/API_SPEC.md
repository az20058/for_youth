# Ember API 명세서

## 공통 사항

### 베이스 URL

```
http://localhost:8080
```

### 응답 형식 (ApiResponse)

모든 응답은 아래 형식으로 래핑됩니다.

**성공:**
```json
{
  "success": true,
  "data": { ... }
}
```

**에러:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지"
  }
}
```

### 인증

- JWT Bearer 토큰 방식
- 인증이 필요한 API는 요청 헤더에 토큰 포함:
  ```
  Authorization: Bearer <access_token>
  ```

### CORS

- Allowed Origins: `http://localhost:3000`
- Allowed Methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
- Allowed Headers: `Content-Type`, `Authorization`

### 에러 코드

| 코드 | HTTP 상태 | 메시지 |
|------|-----------|--------|
| `INVALID_INPUT` | 400 | 잘못된 입력입니다. |
| `UNAUTHORIZED` | 401 | 인증이 필요합니다. |
| `NOT_FOUND` | 404 | 리소스를 찾을 수 없습니다. |
| `INTERNAL_ERROR` | 500 | 서버 오류가 발생했습니다. |
| `APPLICATION_NOT_FOUND` | 404 | 지원서를 찾을 수 없습니다. |
| `SCHEDULE_NOT_FOUND` | 404 | 일정을 찾을 수 없습니다. |
| `QUIZ_INVALID_REQUEST` | 400 | 잘못된 요청입니다. |

---

## Enum 정의

### ApplicationStatus

| 값 | 설명 |
|----|------|
| `지원 예정` | PENDING |
| `코테 기간` | CODING_TEST |
| `면접 기간` | INTERVIEW |
| `지원 완료` | APPLIED |
| `최종 합격` | ACCEPTED |
| `서류 탈락` | REJECTED_DOCS |
| `코테 탈락` | REJECTED_CODING |
| `면접 탈락` | REJECTED_INTERVIEW |

### CompanySize

| 값 | 설명 |
|----|------|
| `대기업` | LARGE |
| `중견기업` | MID_LARGE |
| `중소기업` | MID |
| `스타트업` | STARTUP |

### CoverLetterType

| 값 | 설명 |
|----|------|
| `지원 동기` | MOTIVATION |
| `성장 과정` | GROWTH |
| `직무 역량` | JOB_SKILLS |
| `성격 장단점` | PERSONALITY |
| `성공 경험` | SUCCESS |
| `실패 경험` | FAILURE |
| `팀워크 경험` | TEAMWORK |
| `입사 후 포부` | FUTURE_GOALS |
| `기타` | OTHER |

### ScheduleEventType

| 값 |
|----|
| `CODING_TEST` |
| `INTERVIEW` |
| `DOCUMENT` |
| `OTHER` |

---

## 인증 흐름

### OAuth2 로그인

1. 프론트에서 사용자를 아래 URL로 리다이렉트:
   ```
   GET /oauth2/authorization/google
   GET /oauth2/authorization/kakao
   ```

2. OAuth2 인증 완료 후 Spring이 프론트로 리다이렉트:
   ```
   {FRONTEND_URL}/auth/callback?code={일회용코드}
   ```

3. 프론트에서 일회용 코드로 토큰 교환:

### `POST /api/auth/token`

**인증:** 불필요

**Request Body:**
```json
{
  "code": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
    "refreshToken": "eyJhbGciOiJIUzUxMiJ9..."
  }
}
```

**에러:**

| 상황 | 상태 | 코드 |
|------|------|------|
| 유효하지 않은 코드 | 401 | `UNAUTHORIZED` |

> 코드는 일회용이며, 사용 후 즉시 만료됩니다.

---

## 지원서 API

### `GET /api/applications`

내 지원서 목록 조회 (최신순)

**인증:** 필요

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-...",
      "companyName": "카카오",
      "careerLevel": "신입",
      "deadline": "2026-04-30T00:00:00",
      "companySize": "대기업",
      "status": "지원 예정",
      "url": "https://careers.kakao.com",
      "coverLetters": [
        {
          "id": "660e8400-...",
          "question": "지원 동기를 작성해주세요.",
          "answer": "저는...",
          "type": "지원 동기"
        }
      ],
      "createdAt": "2026-04-15T10:30:00",
      "updatedAt": "2026-04-15T10:30:00"
    }
  ]
}
```

---

### `POST /api/applications`

지원서 생성

**인증:** 필요

**Request Body:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `companyName` | String | ✅ | 회사명 |
| `careerLevel` | String | ✅ | 경력 (예: "신입") |
| `companySize` | CompanySize | ✅ | 기업 규모 (한글) |
| `status` | ApplicationStatus | ✅ | 지원 상태 (한글) |
| `deadline` | String | ❌ | 마감일 (`"2026-04-30"` 형식) |
| `url` | String | ❌ | 채용 URL |
| `coverLetters` | Array | ❌ | 자소서 목록 |

**coverLetters 항목:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `question` | String | ✅ | 질문 |
| `answer` | String | ❌ | 답변 (기본값 "") |
| `type` | CoverLetterType | ❌ | 유형 (한글) |

```json
{
  "companyName": "네이버",
  "careerLevel": "신입",
  "companySize": "대기업",
  "status": "지원 예정",
  "deadline": "2026-05-15",
  "coverLetters": [
    {
      "question": "지원 동기를 작성해주세요.",
      "answer": "",
      "type": "지원 동기"
    }
  ]
}
```

**Response 201:** 생성된 지원서 객체

**에러:**

| 상황 | 상태 | 메시지 |
|------|------|--------|
| 회사명 누락 | 400 | 회사명을 입력해주세요. |
| 경력 누락 | 400 | 경력을 입력해주세요. |
| 기업 규모 누락 | 400 | 기업 규모를 선택해주세요. |
| 상태 누락 | 400 | 상태를 선택해주세요. |
| 자소서 질문 누락 | 400 | 자기소개서 항목에 질문을 입력해주세요. |

---

### `GET /api/applications/{id}`

지원서 단건 조회

**인증:** 필요

**Response 200:** 지원서 객체

**에러:** 404 `APPLICATION_NOT_FOUND`

---

### `PATCH /api/applications/{id}`

지원서 부분 수정 (전달된 필드만 업데이트)

**인증:** 필요

**Request Body (모두 선택):**

| 필드 | 타입 | 설명 |
|------|------|------|
| `companyName` | String | |
| `careerLevel` | String | |
| `companySize` | CompanySize | |
| `status` | ApplicationStatus | |
| `deadline` | String | `"2026-05-01"` 형식 |
| `clearDeadline` | Boolean | `true`면 마감일 제거 |
| `url` | String | |
| `coverLetters` | Array | 전달 시 기존 자소서 **전체 교체** |

```json
{
  "status": "지원 완료"
}
```

**Response 200:** 수정된 지원서 객체

**에러:** 404 `APPLICATION_NOT_FOUND`

---

### `DELETE /api/applications/{id}`

지원서 소프트 삭제

**인증:** 필요

**Response:** `204 No Content`

**에러:** 404 `APPLICATION_NOT_FOUND`

---

## 일정 API

### `GET /api/schedule`

월별 일정 조회 (수동 일정 + 지원서 마감일 자동 이벤트)

**인증:** 필요

**Query Parameters:**

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `year` | Int | 현재 연도 | |
| `month` | Int | 현재 월 | 1-12 |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "770e8400-...",
        "title": "네이버 코딩테스트",
        "date": "2026-04-20T14:00:00",
        "type": "CODING_TEST",
        "source": "manual",
        "memo": "알고리즘 위주 준비"
      },
      {
        "id": "app-550e8400-...",
        "title": "카카오 마감",
        "date": "2026-04-30T00:00:00",
        "type": "DEADLINE",
        "source": "auto",
        "status": "지원 예정"
      }
    ]
  }
}
```

> **source 구분:**
> - `manual`: 사용자가 직접 생성한 일정. `memo` 포함 가능.
> - `auto`: 지원서 마감일에서 자동 생성. ID는 `app-{applicationId}` 형식. `status` 포함.

---

### `POST /api/schedule`

수동 일정 생성

**인증:** 필요

**Request Body:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `title` | String | ✅ | 일정 제목 |
| `date` | String | ✅ | `"2026-04-20T14:00:00"` 형식 |
| `type` | ScheduleEventType | ✅ | `CODING_TEST` / `INTERVIEW` / `DOCUMENT` / `OTHER` |
| `memo` | String | ❌ | 메모 |
| `applicationId` | UUID | ❌ | 연결할 지원서 ID |

```json
{
  "title": "네이버 코딩테스트",
  "date": "2026-04-20T14:00:00",
  "type": "CODING_TEST",
  "memo": "알고리즘 위주 준비"
}
```

**Response 201:** 생성된 일정 객체

---

### `DELETE /api/schedule/{id}`

수동 일정 삭제

**인증:** 필요

**Response:** `204 No Content`

**에러:** 404 `SCHEDULE_NOT_FOUND`

---

## 퀴즈 API

### `POST /api/quiz/result`

퀴즈 결과 저장

**인증:** 필요

**Request Body:**

| 필드 | 타입 | 필수 | 제한 |
|------|------|------|------|
| `answers` | Map<String, Any> | ✅ | 최대 50개 |
| `recommendations` | List<Map<String, Any>> | ✅ | 최대 20개 |

```json
{
  "answers": {
    "need": "employment",
    "status": "job_seeking",
    "region": "11"
  },
  "recommendations": [
    {
      "name": "청년 취업 지원",
      "score": 5
    }
  ]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

---

## 전체 엔드포인트 요약

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/auth/token` | ❌ | OAuth2 코드 → JWT 토큰 교환 |
| GET | `/api/applications` | ✅ | 지원서 목록 조회 |
| POST | `/api/applications` | ✅ | 지원서 생성 |
| GET | `/api/applications/{id}` | ✅ | 지원서 단건 조회 |
| PATCH | `/api/applications/{id}` | ✅ | 지원서 부분 수정 |
| DELETE | `/api/applications/{id}` | ✅ | 지원서 삭제 |
| GET | `/api/schedule?year=&month=` | ✅ | 월별 일정 조회 |
| POST | `/api/schedule` | ✅ | 일정 생성 |
| DELETE | `/api/schedule/{id}` | ✅ | 일정 삭제 |
| POST | `/api/quiz/result` | ✅ | 퀴즈 결과 저장 |

### 미구현 (예정)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/programs` | ❌ | 청년 정책 목록 |
| POST | `/api/recommend` | ❌ | 정책 추천 |
| POST | `/api/applications/{id}/company-summary` | ✅ | 기업 요약 |
| GET | `/api/batch/sync-policies` | Bearer(CRON_SECRET) | 정책 동기화 |
