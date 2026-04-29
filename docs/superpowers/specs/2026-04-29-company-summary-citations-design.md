# 기업 분석 출처 표기(Citations) 설계

- 작성일: 2026-04-29
- 대상: `app/(tabs)/applications/[id]` 내 "기업 분석" 섹션
- 동기: ChatGPT/Claude처럼 AI가 생성한 기업 분석 각 항목이 어느 소스에서 왔는지 사용자가 즉시 확인할 수 있도록 한다.

## 목표 / 비목표

**목표**
- 각 분석 항목(불릿/문장 단위)에 사용된 소스를 시각적으로 표시한다 (도메인 칩 + favicon).
- 칩 클릭/호버 시 소스 제목, 도메인, 원문 링크를 미리 보여준다.
- 기존 캐시(이전 스키마)는 깨뜨리지 않고 lazy 마이그레이션한다.

**비목표**
- 한 문장 내 부분 문자열 단위의 인라인 시테이션(예: "1969년 설립[1]된 …")은 다루지 않는다.
- 자기소개서 생성 등 다른 AI 기능에는 적용하지 않는다.
- 외부에서 og:title을 fetch하지 않는다 — 이미 가지고 있는 메타데이터만 사용한다.

## UX 요약

- 각 불릿 항목 끝에 도메인 칩 1~3개가 인라인 표시된다 (예: `[📰 news.naver]`).
- overview는 단락 아래 한 줄 우측 정렬로 칩이 표시된다.
- 칩 호버/탭 → shadcn `Popover` → 페이지 제목 + 도메인 + "새 탭 열기" 버튼.
- corp-info(금융위 API) 처럼 URL이 없는 소스는 칩은 표시하되 "새 탭 열기" 버튼은 비활성화된다.
- 구 형식(`schemaVersion < 2`) 캐시는 인용 없이 그대로 표시하되, 상단에 "더 정확한 출처와 함께 다시 분석하기" 버튼이 노출된다.

## 데이터 모델

```ts
type SourceType = 'corp-info' | 'naver-web' | 'naver-news' | 'google-news';

interface Source {
  id: string;          // 'S1', 'S2', ... (분석마다 부여)
  type: SourceType;
  title: string;       // 표시용 제목 (corp-info는 '금융위원회 기업기본정보')
  domain: string;      // 'news.naver.com' 등 (corp-info는 'data.go.kr')
  url: string | null;  // corp-info는 null
}

interface CitedItem {
  text: string;
  sourceIds: string[]; // 사용된 소스 ID 배열
}

interface CompanySummaryV2 {
  overview: CitedItem;
  mainBusiness: CitedItem[];
  recentNews: CitedItem[];
  motivationHints: CitedItem[];
  idealCandidate: CitedItem[];
  sources: Source[];
  schemaVersion: 2;
}
```

## DB 스키마 변경 (Prisma)

`CompanySummary` 모델:

```prisma
model CompanySummary {
  id              String   @id @default(cuid())
  companyName     String   @unique
  overview        String   @db.Text  // JSON: CitedItem (v2) | string (v1)
  mainBusiness    String   @db.Text  // JSON: CitedItem[] (v2) | string[] (v1)
  recentNews      String   @db.Text  // JSON: CitedItem[] (v2) | string[] (v1)
  motivationHints String   @db.Text  // JSON: CitedItem[] (v2) | string[] (v1)
  referenceSites  String   @default("[]") @db.Text  // deprecated (v2부터 미사용)
  idealCandidate  String   @default("[]") @db.Text  // JSON: CitedItem[] (v2) | string[] (v1)
  sources         String   @default("[]") @db.Text  // NEW: Source[] JSON
  schemaVersion   Int      @default(1)              // NEW: 1=구버전, 2=인용 포함
  crawledAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

마이그레이션:
- `ALTER TABLE "CompanySummary" ADD COLUMN "sources" TEXT NOT NULL DEFAULT '[]'`
- `ALTER TABLE "CompanySummary" ADD COLUMN "schemaVersion" INTEGER NOT NULL DEFAULT 1`
- 기존 행은 자동으로 `schemaVersion=1`이 되어 lazy 무효화 흐름을 탄다.
- 새 분석부터는 항상 `schemaVersion=2`로 저장한다.

## 크롤링 변경 (`lib/crawl.ts`)

각 fetcher가 텍스트뿐 아니라 부분 Source 정보를 함께 반환한다 (ID 부여 전).

```ts
interface CrawlResult {
  corpInfo: string | null;
  webSnippets: string | null;
  newsHeadlines: string[];
  sources: Source[];   // NEW: ID(S1..Sn)가 부여된 소스 목록
  // sourceUrls는 더 이상 사용하지 않음 (deprecated)
}
```

각 fetcher:
- `fetchCorpInfo`: 데이터 있으면 `Source { type: 'corp-info', title: '금융위원회 기업기본정보', domain: 'data.go.kr', url: null }` 1개 추가
- `fetchWebSearch`: 결과별 `{ title, link }` → Source (`type: 'naver-web'`)
- `fetchNaverNews`: 헤드라인+`originallink`/`link` → Source (`type: 'naver-news'`). 현재 3개로 잘라내던 것을 헤드라인 수에 맞춰 1:1 매칭한다.
- `fetchGoogleNews`: **현재 RSS의 `<link>`를 추출하지 않음 → 추가한다.** RSS item에서 `<title>`-`<link>` 쌍을 같이 파싱해 Source(`type: 'google-news'`)를 만든다.

`crawlCompanyInfo`는 최종 단계에서 모든 Source에 `S1..Sn` ID를 일괄 부여한 뒤 `CrawlResult.sources`에 넣는다.

## AI 프롬프트 + 응답 (`lib/companySummary.ts`)

프롬프트에 소스 목록을 ID와 함께 포함한다.

```
[소스 목록]
S1 (금융위원회): 기업명: …, 업종: …, 설립일: …
S2 (네이버 웹검색 - news.naver.com): "삼성전자, AI 반도체 신사업 …"
S3 (네이버 뉴스 - chosun.com): "삼성, 美 반도체 회사 인수 추진 …"
S4 (구글 뉴스 - bloomberg.com): "Samsung Q3 earnings beat …"

각 항목 끝에 사용한 소스 ID를 sourceIds 배열로 명시하세요.
실제 그 항목의 근거가 된 소스만 포함하고, 추측하지 마세요.
mainBusiness 같은 일반 사실은 1~2개 소스, recentNews는 보통 1개 소스가 적절합니다.
sourceIds가 빈 배열이면 안 되며, 적절한 소스가 없으면 항목 자체를 만들지 마세요.
```

응답 스키마:
```json
{
  "overview": { "text": "...", "sourceIds": ["S1","S2"] },
  "mainBusiness":   [{ "text": "...", "sourceIds": ["S1"] }],
  "recentNews":     [{ "text": "...", "sourceIds": ["S3"] }],
  "motivationHints":[{ "text": "...", "sourceIds": ["S2","S3"] }],
  "idealCandidate": [{ "text": "...", "sourceIds": ["S2"] }]
}
```

후처리:
- 응답의 `sourceIds` 중 실제 존재하지 않는 ID는 제거 (환각 방어)
- 모든 sourceIds가 제거되어 빈 배열이 된 항목은 그대로 두되 칩이 표시되지 않는다.

## API (`app/api/applications/[id]/company-summary/route.ts`)

GET 응답:
```ts
{
  overview: CitedItem | string,             // schemaVersion에 따라 형식 다름
  mainBusiness: CitedItem[] | string[],
  recentNews: CitedItem[] | string[],
  motivationHints: CitedItem[] | string[],
  idealCandidate: CitedItem[] | string[],
  sources: Source[],                         // v1이면 빈 배열
  schemaVersion: 1 | 2,
  crawledAt: string,
}
```

POST 응답: 동일 구조 (항상 v2로 저장).

24h 캐시 정책은 그대로. v1 캐시는 만료 시 또는 사용자가 새로고침 클릭 시 v2로 덮어쓴다.

## UI

### `_components/SourceChip.tsx` (신규)

Props: `{ source: Source; size?: 'sm' | 'xs' }`

- `<Popover>`로 감싼 `<Badge variant="outline">`
- 칩 내부: favicon `<img src="https://www.google.com/s2/favicons?domain={domain}&sz=32" />` + 짧은 도메인 (예: `news.naver` — TLD 제외)
- Popover 내부: 제목, 전체 도메인, "새 탭 열기" 버튼 (`url`이 null이면 비활성)
- 모바일은 호버가 없으므로 클릭 시 popover 열림 (shadcn 기본 동작)

### `CompanySummary.tsx` 변경

- 데이터 타입을 `CompanySummaryV2`로 교체
- `schemaVersion === 1`이면:
  - 기존처럼 인용 없이 렌더 + 상단에 "더 정확한 출처와 함께 다시 분석하기" 안내 버튼 (재분석 = `analyze()` 호출)
- `schemaVersion === 2`이면:
  - `Map<string, Source>`를 만들어 빠른 조회
  - overview: `<p>{text}</p>` 아래 우측 정렬로 `sourceIds.map(id => <SourceChip source={map.get(id)!} />)`
  - 각 불릿: `<li>{text} {sourceIds.map(...)}<\/li>` (불릿과 칩 사이는 inline-flex gap)
- 하단 "참고 사이트" 섹션은 유지하되 카드 형태로 업그레이드: favicon + 제목 + 도메인 + URL

## 호환성 / 폴백

- 구 v1 캐시는 그대로 보존되며 lazy 마이그레이션
- 마이그레이션 적용 직후 모든 행이 `schemaVersion=1`이므로, 기존 사용자는 한 번 더 "AI 분석" 버튼을 눌러야 새 UI를 본다
- 24h TTL이 만료된 캐시는 재분석 시 자동 v2로 덮어써짐

## 영향 받는 파일

- `prisma/schema.prisma` (sources, schemaVersion 추가)
- `prisma/migrations/<new>/migration.sql`
- `lib/crawl.ts` (Source 추출 + Google News URL 파싱)
- `lib/companySummary.ts` (프롬프트, 응답 파싱, 검증, 환각 방어)
- `app/api/applications/[id]/company-summary/route.ts` (응답 형식)
- `app/(tabs)/applications/[id]/_components/CompanySummary.tsx`
- `app/(tabs)/applications/[id]/_components/SourceChip.tsx` (신규)

## 검증

- `npx eslint <변경 파일>` 통과
- `npx tsc --noEmit` 통과
- Playwright 시각 검증:
  - 분석 전 (버튼)
  - 로딩
  - v2 분석 결과 (각 불릿에 칩, overview 우측 칩)
  - 칩 호버/클릭 시 Popover
  - corp-info 칩 (URL 없는 케이스)
  - v1 캐시 폴백 화면 ("다시 분석하기" 안내)
  - 에러 화면

## 리스크 / 트레이드오프

- **AI 환각**: 잘못된 sourceId를 부여할 수 있다. 후처리 검증으로 거른다. 일부 항목의 sourceIds가 빈 배열로 끝날 수 있고, 그 경우 칩 없이 표시된다.
- **출력 토큰 증가**: 응답 구조가 깊어져 출력 토큰이 늘어난다. Haiku 4.5 + max_tokens 1024는 충분하지만 모니터링 필요.
- **favicon 의존성**: Google s2 favicons API가 외부 서비스라 가용성 의존이 있다. 실패해도 칩 본문은 노출되도록 `onError` 처리.
- **lazy 마이그레이션 UX**: 사용자가 다시 한 번 분석 버튼을 눌러야 새 UI가 보인다. 이는 의도된 동작이며 안내 문구로 보완한다.
