# 자격증·어학 날짜 입력 간소화 (연·월만 선택)

## 배경

마이페이지의 자격증·어학 편집에서 취득일을 `DatePicker`(연+월+일 달력)로 입력한다. 연·월·일을 모두 골라야 해서 번거롭다는 피드백.

## 목표

취득일을 **연·월 select 2개**로 단순화한다. 일 단위 정보는 실제로 사용되지 않으므로 드롭한다.

## 변경 내역

### 1. `app/(tabs)/mypage/_components/CertPortfolio.tsx`

`CertItemEditor` 레이아웃을 재구성한다.

- 기존: `grid-cols-3`에 `발급기관 / DatePicker / 자격번호` 배치
- 변경:
  - `grid-cols-2`에 `발급기관 / 자격번호`
  - 그 아래 별도 전폭 행에 `DatePicker granularity='month'`

`granularity='month'`는 연/월 select 2개(`flex gap-1`)로 렌더된다. 3열 그리드 안에서는 모바일 폭(~390px)에서 select 2개 + input이 겹쳐 표시되므로 취득일은 독립 행으로 분리한다.

`CertItemView`의 표시 포맷을 `yyyy.MM.dd` → `yyyy.MM`로 변경.

### 2. 데이터 형식

- 저장값: 기존 `yyyy-MM-dd` 문자열 유지. `granularity='month'`는 내부적으로 day=1로 Date를 만들어 전달하므로 `format(date, 'yyyy-MM-dd')` 결과는 항상 `yyyy-MM-01`.
- 타입·API·DB 스키마 변경 없음.

### 3. 기존 데이터 호환

- 이전에 `2024-03-15`처럼 저장된 값이 있어도 `parseISO` → `granularity='month'`가 `getFullYear`/`getMonth`만 읽으므로 **선택 상태는 정상 표시**된다.
- 단, 사용자가 해당 항목을 다시 편집·저장하면 일 부분이 `01`로 덮어써짐. 연·월 정보만 보존되므로 의도와 일치.
- 뷰(`CertItemView`)는 `yyyy.MM`로만 보여주므로 기존 데이터의 일 부분은 화면에 드러나지 않음.

## 비목표

- 다른 페이지(일정, 지원현황 등)의 DatePicker는 건드리지 않는다 — 정확한 날짜가 필요하므로.
- `DatePicker` 컴포넌트 자체 수정은 없다 — `granularity='month'` 모드는 이미 구현돼 있음.

## 검증

- 자격증·어학 편집 진입 → 연도/월 드롭다운 노출 확인
- 신규 항목 저장 → DB에 `yyyy-MM-01` 저장 확인
- 기존 `yyyy-MM-dd` 값이 있는 항목 편집 → 연·월 자동 선택 확인
- `npx eslint`, `npx tsc --noEmit` 통과
- Playwright 스크린샷으로 레이아웃 확인 (grid-cols-3 3칸 안에 select 2개가 문제없이 들어가는지)
