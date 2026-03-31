# 새 지원서 생성 폼 설계

**날짜:** 2026-03-31

## 개요

`/applications` 목록 페이지 상단에 인라인 폼을 추가해 새 지원서를 생성한다. 제출 후 동일 페이지에 머물며 목록이 갱신된다.

## 파일 구조

| 파일 | 역할 |
|---|---|
| `app/applications/page.tsx` | `NewApplicationForm` + 목록 렌더링 (Server Component 유지) |
| `app/applications/actions.ts` | Server Action — `createApplication(data)` |
| `components/NewApplicationForm.tsx` | Client Component — 인라인 폼 |
| `lib/applicationValidation.ts` | 순수 유효성 검사 함수 |
| `lib/applications.ts` | `addApplication()` 추가 |

## 폼 필드

| 필드 | 타입 | 필수 여부 | 기본값 |
|---|---|---|---|
| `companyName` | text | 필수 | — |
| `careerLevel` | text | 필수 | — |
| `deadline` | date | 필수 | — |
| `companySize` | select (`CompanySize`) | 필수 | — |
| `status` | select (`ApplicationStatus`) | 필수 | `'지원 예정'` |
| `coverLetters` | 동적 목록 | 선택 | `[]` |

## 유효성 검사 규칙

- `companyName`: 빈 문자열 불가
- `careerLevel`: 빈 문자열 불가
- `deadline`: 오늘 이상의 날짜여야 함
- `companySize`: `CompanySize` enum 값 중 하나
- `status`: `ApplicationStatus` enum 값 중 하나
- `coverLetters` 각 항목: `question` 필수 (추가한 경우에 한함)

에러는 필드별로 분리 (`FormErrors` 타입).

## 데이터 흐름

```
Client form 제출
  → validateApplication() 클라이언트 검사
  → 실패: 필드별 에러 메시지 표시 (페이지 이동 없음)
  → 성공: createApplication(data) Server Action 호출
    → addApplication() in-memory 배열에 추가
    → revalidatePath('/applications')
    → 폼 초기화
```

## 테스트 범위

### `__tests__/applications/applicationValidation.test.ts`
- 각 필수 필드 누락 → 해당 필드 에러 반환
- 과거 deadline → 에러 반환
- 잘못된 companySize/status 값 → 에러 반환
- 모든 필드 유효 → 에러 없음 (빈 객체 반환)
- coverLetter 추가 후 question 비움 → 에러 반환

### `__tests__/applications/NewApplicationForm.test.tsx`
- 필수 필드 비우고 제출 → 에러 메시지 렌더링
- 유효한 값 입력 후 제출 → Server Action 호출
- coverLetter 추가 후 question 비우고 제출 → 에러 메시지 렌더링
