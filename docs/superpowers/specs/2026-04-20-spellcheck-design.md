# 자기소개서 맞춤법 검사 기능 설계

## 개요

`CoverLetterAccordion`의 답변 영역에 한국어 맞춤법 검사 기능을 추가한다.
`hanspell` npm 패키지(Daum 맞춤법 검사기 활용)를 서버사이드에서 호출하고,
클라이언트에서는 오류 하이라이트 + 교정안 선택 UI를 제공한다.

## 아키텍처

### 파일 구성

| 파일 | 역할 |
|------|------|
| `app/api/speller/route.ts` | hanspell 호출 프록시 API |
| `app/(tabs)/applications/[id]/_components/SpellerHighlightView.tsx` | 하이라이트 뷰 컴포넌트 |
| `app/(tabs)/applications/[id]/_components/CoverLetterAccordion.tsx` | 버튼 추가 및 모드 관리 |
| `lib/coverLetter.ts` | SpellingError 타입 확장 |

### API 라우트

**POST `/api/speller`**

요청:
```json
{ "text": "검사할 텍스트" }
```

응답:
```json
{
  "typos": [
    {
      "token": "어떡해",
      "suggestions": ["어떻게"],
      "info": "뜻으로 볼 때 틀렸을 가능성이 큽니다.",
      "start": 5,
      "end": 8
    }
  ]
}
```

- `start`/`end`는 서버에서 `token`을 원문에서 찾아 계산 (indexOf 순차 탐색)
- hanspell `spellCheckByDAUM` 사용 (1000자 제한, 초과 시 분할 처리는 hanspell이 내부 처리)
- 오류 시 500 반환

### 클라이언트 상태

`CoverLetterAccordion`에 `mode: 'edit' | 'checking' | 'highlight'` 추가:

- `edit`: 기존 textarea 편집 모드 (기본값)
- `checking`: API 호출 중, 버튼 로딩 표시
- `highlight`: `SpellerHighlightView` 렌더링

### SpellerHighlightView 컴포넌트

props:
```ts
interface SpellerHighlightViewProps {
  text: string;
  typos: Typo[];
  onApply: (correctedText: string) => void;
  onCancel: () => void;
}
```

동작:
1. 텍스트를 오류 위치 기준으로 분할해 일반 span + 오류 span으로 렌더링
2. 오류 span 클릭 → Popover로 교정안 목록 표시
3. 교정안 선택 → `selectedCorrections: Record<number, string>` 상태에 저장 (key: start)
4. "적용" 버튼 → 뒤에서부터 치환 (앞에서 치환하면 인덱스 밀림) → `onApply(correctedText)` 호출
5. "취소" 버튼 → `onCancel()` 호출

### 교정 적용 로직

인덱스 밀림 방지를 위해 `start` 기준 내림차순 정렬 후 순서대로 `text.slice` 치환.

## UI

- "맞춤법 검사" 버튼: 글자 수 표시 옆에 배치 (AccordionContent 하단)
- 오류 하이라이트: `bg-yellow-100 text-yellow-800 underline decoration-wavy` 스타일
- 교정안 선택된 항목: `bg-green-100 text-green-800` 스타일로 변경
- Popover: shadcn/ui `Popover` 컴포넌트 사용

## 에러 처리

- API 실패 → toast.error("맞춤법 검사에 실패했습니다.")
- 오류 없음 → toast.success("맞춤법 오류가 없습니다.")
- 빈 텍스트 → 버튼 비활성화
