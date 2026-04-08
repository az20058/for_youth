# 기업 분석 AI 요약 기능 설계

**날짜:** 2026-04-08  
**목적:** 지원서 상세 페이지에서 해당 기업의 정보를 AI로 요약하여 지원 동기 작성을 돕는다.

---

## 1. 개요

사용자가 지원서 상세 페이지(`/applications/[id]`)에서 "AI로 기업 분석하기" 버튼을 클릭하면, 나무위키와 구글 뉴스 RSS를 크롤링하여 Claude Haiku 4.5로 요약한 결과를 보여준다. 결과는 DB에 캐싱되어 24시간 이내 재호출 시 즉시 반환한다.

---

## 2. 데이터 흐름

```
[기업 분석 버튼 클릭]
        ↓
POST /api/applications/[id]/company-summary
        ↓
  DB 캐시 확인 (24시간 이내?)
   ├─ YES → 캐시 반환
   └─ NO  → 나무위키 크롤링
              + 구글 뉴스 RSS 크롤링
                    ↓
           Claude Haiku 4.5 요약
                    ↓
            DB 저장 후 반환
```

---

## 3. DB 스키마

`Application`에 1:1로 연결되는 `CompanySummary` 모델을 추가한다.

```prisma
model CompanySummary {
  id              String      @id @default(cuid())
  applicationId   String      @unique
  application     Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  overview        String      @db.Text       // 기업 개요 (2-3문장)
  mainBusiness    String      @db.Text       // 핵심 사업 영역 (JSON string[])
  recentNews      String      @db.Text       // 최근 주요 이슈 (JSON string[])
  motivationHints String      @db.Text       // 지원 동기 포인트 (JSON string[])
  crawledAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}
```

`Application` 모델에 relation 추가:
```prisma
companySummary CompanySummary?
```

---

## 4. API

### `POST /api/applications/[id]/company-summary`

**처리 순서:**
1. 인증 확인 — 본인 지원서인지 검증
2. DB 캐시 확인 — `crawledAt`이 24시간 이내면 즉시 반환
3. 나무위키 크롤링 — `https://namu.wiki/raw/{회사명}` (raw 텍스트)
4. 구글 뉴스 RSS 크롤링 — `https://news.google.com/rss/search?q={회사명}&hl=ko&gl=KR` (최근 10개)
5. Claude Haiku 4.5 요약 요청
6. DB upsert 후 반환

**응답 형태:**
```json
{
  "overview": "카카오는 국내 최대 모바일 플랫폼 기업으로...",
  "mainBusiness": ["카카오톡", "카카오페이", "카카오모빌리티"],
  "recentNews": ["2025년 AI 서비스 강화 발표", "카카오뱅크 흑자 전환"],
  "motivationHints": ["모바일 플랫폼 혁신 선도", "AI 기술 투자 지속 확대"],
  "crawledAt": "2026-04-08T10:00:00.000Z"
}
```

**에러 처리:**
- 나무위키 페이지 없음 → 뉴스 결과만으로 요약
- 두 소스 모두 실패 → 500 반환
- Claude API 실패 → 500 반환

---

## 5. Claude 프롬프트

```
다음은 {회사명}에 대한 정보입니다.

[나무위키 원문]
{namuWikiText}

[최근 뉴스]
{newsTitles}

위 내용을 바탕으로 취업 준비생이 지원 동기를 작성할 수 있도록 아래 항목을 JSON 형식으로 한국어로 답해주세요:
- overview: 기업 개요 (2-3문장)
- mainBusiness: 핵심 사업 영역 (3-5개 문자열 배열)
- recentNews: 최근 주요 이슈 (2-3개 문자열 배열)
- motivationHints: 지원 동기 작성에 활용할 수 있는 포인트 (2-3개 문자열 배열)
```

---

## 6. 새로 만들 파일

| 파일 | 역할 |
|------|------|
| `lib/crawl.ts` | 나무위키 + 구글 뉴스 RSS 크롤링 |
| `lib/companySummary.ts` | Claude API 호출 및 응답 파싱 |
| `app/api/applications/[id]/company-summary/route.ts` | API Route |
| `app/(tabs)/applications/[id]/_components/CompanySummary.tsx` | UI 컴포넌트 |

## 8. 수정할 파일

| 파일 | 변경 내용 |
|------|-----------|
| `prisma/schema.prisma` | CompanySummary 모델 추가, Application에 relation 추가 |
| `app/(tabs)/applications/[id]/page.tsx` | CompanySummary 컴포넌트 삽입 |

---

## 9. UI

기업 정보 카드 아래에 "기업 분석" 섹션을 추가한다.

**상태별 렌더링:**
- 미분석 → "AI로 기업 분석하기" 버튼
- 로딩 중 → `<FlameLoading />` 인라인 variant
- 결과 있음 → 개요 / 핵심 사업 / 최근 이슈 / 지원 동기 포인트 카드 + 마지막 분석 시간 + 새로고침 버튼
- 에러 → "분석 실패, 다시 시도해주세요" 메시지

---

## 10. 기술 선택 근거

- **Claude Haiku 4.5** — 단순 요약 작업에 Sonnet 과스펙, 한국어 품질 우수, 비용 최소
- **나무위키 raw API** — HTML 파싱 불필요, 기업 소개/사업 정보가 잘 정리됨
- **구글 뉴스 RSS** — 별도 API 키 없이 안정적으로 최신 뉴스 수집 가능
- **24시간 캐싱** — on-demand 구조에서 중복 API 호출 방지
