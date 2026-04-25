# Mobile Native Features Design

## Overview

WebView 래퍼 모바일 앱에 4가지 네이티브 기능을 추가하여 UX 개선.

## 1. 생체 인증 / 앱 잠금

**패키지:** expo-local-authentication, expo-secure-store

**컴포넌트:**
- `components/AuthGate.tsx` — 루트 레이아웃 감싸는 잠금 게이트
- `hooks/useAuthSettings.ts` — SecureStore 기반 잠금 설정 on/off

**플로우:**
- 앱 열림 → AuthGate → 잠금 활성화 시 생체 인증 요청 → 성공 시 children 렌더
- AppState `background→active` 전환 시 재인증
- 설정 토글: 앱 내 Pressable 기반 (마이페이지 상단 또는 별도 설정)

## 2. 오프라인 알림 목록

**패키지:** expo-sqlite

**컴포넌트:**
- `lib/db.ts` — SQLite 초기화, notifications 테이블
- `lib/api.ts` — 공통 fetch 헬퍼 (BASE_URL, 인증 헤더)
- `hooks/useNotifications.ts` — 로컬 DB 읽기 + API 동기화
- `app/(tabs)/notifications.tsx` — 네이티브 FlatList 화면
- `components/NotificationItem.tsx` — 알림 아이템 렌더

**테이블:** `notifications(id TEXT PK, type TEXT, title TEXT, message TEXT, isRead INTEGER DEFAULT 0, relatedId TEXT, createdAt TEXT)`

**동기화:** 화면 열림 시 SQLite에서 즉시 표시 → 백그라운드 API fetch → 새 항목 upsert

**탭 변경:** 4탭 → 5탭 (홈/지원현황/일정/알림/마이)

## 3. 네이티브 캘린더 뷰

**컴포넌트:**
- `app/(tabs)/schedule.tsx` — 네이티브 화면으로 교체
- `components/calendar/MonthCalendar.tsx` — 월간 달력 그리드
- `components/calendar/EventList.tsx` — 선택 날짜 일정 목록
- `components/calendar/AddEventSheet.tsx` — 일정 추가 바텀시트
- `hooks/useScheduleApi.ts` — /api/schedule fetch + 로컬 상태 관리

**API:** 기존 `/api/schedule` (GET/POST/DELETE/PATCH) 그대로 사용

**이벤트 색상:** DEADLINE/DOCUMENT=red, CODING_TEST=blue, INTERVIEW=purple, OTHER=gray

## 4. 네이티브 자기소개서 에디터

**컴포넌트:**
- `app/editor.tsx` — Stack 모달 화면
- `components/editor/CoverLetterEditor.tsx` — 항목별 question/answer TextInput
- `components/editor/TypeSelector.tsx` — 유형 선택기

**WebView 브릿지:**
- WebView `onMessage` → `{ action: 'openEditor', applicationId, coverLetters }` 수신
- 네이티브 에디터에서 편집 → API PATCH `/api/applications/{id}` → WebView reload

**CoverLetter 타입:** id, question, answer, type(지원동기|성장과정|직무역량|성격장단점|성공경험|실패경험|팀워크경험|입사후포부|기타)

## 신규 의존성

- expo-local-authentication
- expo-secure-store
- expo-sqlite
