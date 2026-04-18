# 마이페이지 확장 & 알림 시스템 설계

## 개요

마이페이지를 프로필/로그아웃만 있는 상태에서 취업 준비에 필요한 개인 정보를 관리할 수 있도록 확장하고, 인앱 알림 시스템을 추가한다.

## 1. 마이페이지 확장

### 1.1 추가 프로필 필드

User 모델에 다음 필드를 추가한다:

| 필드 | 타입 | 설명 |
|------|------|------|
| bio | String? | 한줄 자기소개 |
| desiredJob | String? | 희망 직무 (예: 프론트엔드 개발) |
| desiredIndustry | String? | 희망 업종 (예: IT/소프트웨어) |
| desiredRegion | String? | 희망 지역 (예: 서울) |
| school | String? | 학교명 |
| major | String? | 전공 |
| careerLevel | String? | 경력 수준 (신입/1~3년/3~5년/5년 이상) |
| portfolioUrl | String? | 포트폴리오 링크 |
| certifications | Json? | 자격증 목록 (문자열 배열, 예: ["정보처리기사", "SQLD"]) |
| techStacks | Json? | 기술 스택 목록 (문자열 배열, 예: ["React", "TypeScript"]) |

모든 필드는 nullable로, 사용자가 원하는 항목만 채울 수 있다.

### 1.2 UI 구조

단일 페이지 섹션형 레이아웃. 기존 `(tabs)` 레이아웃의 `max-w-3xl` 안에 렌더링된다.

**섹션 구성:**

1. **프로필 헤더** — 프로필 이미지 + 이름 + 이메일 + 한줄 자기소개 + 편집 버튼
2. **희망 조건** — 희망 직무, 희망 업종, 희망 지역 (3열 그리드, 모바일 1열)
3. **학력 & 경력** — 학교/전공, 경력 수준 (2열 그리드, 모바일 1열)
4. **기술 스택** — 태그 칩 형태, 입력 시 추가/삭제 가능
5. **자격증 & 포트폴리오** — 자격증(태그), 포트폴리오 URL 링크
6. **계정 관리** — 로그아웃 버튼 (기존 유지)

**편집 방식:**
- 각 섹션에 "편집" 버튼 → 클릭 시 해당 섹션이 편집 모드로 전환 (인라인)
- 편집 모드에서 "저장" / "취소" 버튼 표시
- 기술 스택/자격증: 텍스트 입력 후 Enter로 태그 추가, X 버튼으로 삭제

### 1.3 API

**`PATCH /api/user/profile`**
- 인증 필수
- body: 수정할 필드만 포함 (partial update)
- 응답: 업데이트된 User 객체

**`GET /api/user/profile`**
- 인증 필수
- 응답: 현재 사용자의 프로필 정보 (추가 필드 포함)

### 1.4 컴포넌트 구조

```
app/(tabs)/mypage/
├── page.tsx                    # 마이페이지 메인 (섹션 조합)
└── _components/
    ├── ProfileHeader.tsx       # 프로필 헤더 섹션 (이미지, 이름, bio)
    ├── DesiredConditions.tsx    # 희망 조건 섹션
    ├── EducationCareer.tsx     # 학력 & 경력 섹션
    ├── TechStacks.tsx          # 기술 스택 섹션
    ├── CertPortfolio.tsx       # 자격증 & 포트폴리오 섹션
    └── TagInput.tsx            # 태그 입력 공용 컴포넌트 (기술스택, 자격증에서 재사용)
```

## 2. 알림 시스템

### 2.1 Notification 모델

```prisma
model Notification {
  id        String             @id @default(cuid())
  userId    String
  user      User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String
  message   String
  isRead    Boolean            @default(false)
  relatedId String?            // 관련 Application/ScheduleEvent ID
  createdAt DateTime           @default(now())

  @@index([userId])
  @@index([userId, isRead])
}

enum NotificationType {
  DEADLINE       // 마감 임박 (D-3, D-1)
  SCHEDULE       // 일정 알림 (코테, 면접)
  STATUS_CHANGE  // 지원 상태 변경
}
```

User 모델에 `notifications Notification[]` 관계 추가.

### 2.2 알림 표시 — 헤더 벨 아이콘

`components/ui/header.tsx`의 프로필 아이콘 왼쪽에 벨(Bell) 아이콘 추가.

- 읽지 않은 알림이 있으면 빨간 뱃지에 개수 표시
- 로그인 상태에서만 표시

### 2.3 데스크톱: 드롭다운

- 벨 클릭 시 Popover 드롭다운 표시 (shadcn/ui Popover 활용)
- 최근 알림 목록 (최대 10개)
- "모두 읽음" 버튼 — 모든 알림을 읽음 처리
- "전체 알림 보기" 링크 → `/notifications` 페이지 이동
- 읽지 않은 알림: 좌측 주황색 dot + 약간 강조된 배경
- 읽은 알림: dot 없음, 텍스트 흐리게

### 2.4 모바일: 독립 페이지

- 벨 클릭 시 `/notifications`로 이동
- 뒤로가기 버튼 + "알림" 제목 + "모두 읽음" 버튼
- 전체 알림 목록 (무한 스크롤)
- 알림 클릭 시 관련 페이지로 이동 (예: 마감 임박 → 해당 지원서 상세)

### 2.5 반응형 동작 분기

- `md:` breakpoint 기준으로 분기
- 데스크톱(`md:` 이상): 벨 클릭 → Popover 드롭다운
- 모바일(`md:` 미만): 벨 클릭 → `/notifications` 페이지 Link

### 2.6 API

**`GET /api/notifications`**
- 인증 필수
- query: `limit` (기본 10), `offset` (기본 0)
- 응답: 알림 목록 (최신순)

**`GET /api/notifications/unread-count`**
- 인증 필수
- 응답: `{ count: number }`

**`PATCH /api/notifications/read`**
- 인증 필수
- body: `{ ids: string[] }` (특정 알림 읽음 처리) 또는 `{ all: true }` (모두 읽음)

### 2.7 컴포넌트 구조

```
components/
├── NotificationBell.tsx        # 벨 아이콘 + 뱃지 + 데스크톱 드롭다운 + 모바일 링크
└── NotificationItem.tsx        # 개별 알림 항목 (드롭다운/페이지 공용)

app/(tabs)/notifications/
├── page.tsx                    # 모바일 알림 전체 페이지
└── _components/
    └── NotificationList.tsx    # 알림 목록 (무한 스크롤)
```

### 2.8 알림 종류별 표시

| 타입 | 제목 예시 | 메시지 예시 | 클릭 시 이동 |
|------|-----------|-------------|-------------|
| DEADLINE | 마감 임박: 네이버 서류 마감 | D-1 \| 내일 마감입니다 | `/applications/{id}` |
| SCHEDULE | 일정 알림: 카카오 코딩테스트 | 오늘 오후 2시 예정 | `/schedule` |
| STATUS_CHANGE | 상태 변경: 라인 → 코테 기간 | 지원 상태가 변경되었습니다 | `/applications/{id}` |

### 2.9 서버 푸시 (향후)

현재 스코프에서는 Notification 모델과 조회/읽음 처리 API만 구현한다. 실제로 알림을 자동 생성하는 배치/트리거 로직은 향후 구현 범위이다. 테스트를 위해 시드 데이터나 수동 생성 API를 제공할 수 있다.

## 3. DB 마이그레이션 요약

### User 모델 변경
- 추가 필드 10개 (bio, desiredJob, desiredIndustry, desiredRegion, school, major, careerLevel, portfolioUrl, certifications, techStacks)
- notifications 관계 추가

### 새 모델
- Notification (id, userId, type, title, message, isRead, relatedId, createdAt)
- NotificationType enum (DEADLINE, SCHEDULE, STATUS_CHANGE)

### 인덱스
- Notification: `[userId]`, `[userId, isRead]`

## 4. 데이터 흐름

### 마이페이지 프로필 편집
```
섹션 "편집" 클릭 → 인라인 편집 모드
→ 수정 후 "저장" → PATCH /api/user/profile
→ React Query 캐시 갱신 → 뷰 모드로 복귀
```

### 알림 조회 (데스크톱)
```
헤더 렌더링 → GET /api/notifications/unread-count → 뱃지 표시
벨 클릭 → GET /api/notifications?limit=10 → 드롭다운 표시
알림 클릭 → PATCH /api/notifications/read (해당 ID) → 관련 페이지 이동
"모두 읽음" → PATCH /api/notifications/read { all: true } → 뱃지 초기화
```

### 알림 조회 (모바일)
```
벨 클릭 → /notifications 페이지 이동
→ GET /api/notifications → 전체 목록 표시
알림 클릭 → 읽음 처리 + 관련 페이지 이동
```
