# SEO 구현 설계 — For Youth

**날짜:** 2026-04-11
**도메인:** for-youth.site
**브랜드명:** For Youth
**서비스:** 이직·취업 준비 청년을 위한 정부 지원 프로그램 탐색 + 지원 현황 관리

---

## 목표

도메인 신규 등록 시점에 검색엔진 크롤러가 처음 방문할 때, 공개 페이지가 올바르게 인덱싱되고 SNS 공유 시 풍부한 미리보기가 표시되도록 한다.

---

## 범위

### 공개 페이지 (SEO 대상)
| 경로 | 용도 |
|------|------|
| `/` | 홈 — 프로그램 추천, 히어로 캐러셀 |
| `/programs` | 정책 둘러보기 |
| `/quiz` | 맞춤 프로그램 추천 퀴즈 |

### 인증 필요 페이지 (noindex)
- `/(tabs)/*` — `/applications`, `/cover-letters`, `/schedule`
- `/login`

### 제외 (비공개/테스트)
- `/test-datepicker`, `/api/*`

---

## 섹션 1: 루트 Layout 메타데이터

**파일:** `app/layout.tsx`

```ts
export const metadata: Metadata = {
  metadataBase: new URL("https://for-youth.site"),
  title: {
    template: "%s | For Youth",
    default: "For Youth — 청년 취업·이직 준비 플랫폼",
  },
  description: "이직과 취업을 준비하는 청년을 위한 정부 지원 프로그램 탐색과 지원 현황 관리 서비스",
  openGraph: {
    siteName: "For Youth",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: "/",
  },
};
```

---

## 섹션 2: 페이지별 metadata export

각 페이지 파일에 `export const metadata: Metadata = { ... }` 추가.
`"use client"` 페이지는 별도 서버 컴포넌트로 분리 필요.

| 페이지 파일 | title | description | 비고 |
|-------------|-------|-------------|------|
| `app/(home)/page.tsx` | (default) | "청년 취업·이직을 위한 정부 지원 프로그램을 추천받고, 지원 현황을 한눈에 관리하세요." | 현재 `"use client"` → 서버/클라이언트 분리 |
| `app/(home)/programs/page.tsx` | "정책 둘러보기" | "청년 취업·창업·주거를 위한 정부 지원 정책과 프로그램을 찾아보세요." | — |
| `app/quiz/page.tsx` | "맞춤 프로그램 추천" | "간단한 질문으로 나에게 맞는 청년 지원 프로그램을 추천받으세요." | — |
| `app/login/page.tsx` | "로그인" | — | `robots: { index: false }` |
| `app/(tabs)/layout.tsx` | — | — | `robots: { index: false, follow: false }` |

---

## 섹션 3: 기술 SEO 파일

### `app/sitemap.ts`
```ts
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://for-youth.site", lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: "https://for-youth.site/programs", lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: "https://for-youth.site/quiz", lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];
}
```

### `app/robots.ts`
```ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/programs", "/quiz"],
        disallow: ["/api/", "/applications", "/cover-letters", "/schedule", "/test-datepicker", "/login"],
      },
    ],
    sitemap: "https://for-youth.site/sitemap.xml",
  };
}
```

---

## 섹션 4: OG 이미지 동적 생성

**파일:** `app/opengraph-image.tsx`

Next.js `ImageResponse` 사용. 1200×630.
디자인:
- 배경: `#1C1C1E` (앱 다크 배경 톤 일치)
- 상단: 브랜드명 "For Youth" (흰색, 큰 텍스트)
- 하단: 서브타이틀 "청년 취업·이직 준비 플랫폼" (회색)
- 우측: ember-flame 아이콘 또는 장식 요소

---

## 섹션 5: JSON-LD 구조화 데이터

**파일:** `app/layout.tsx` (루트 layout `<body>` 내 `<script>` 삽입)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "name": "For Youth",
      "url": "https://for-youth.site",
      "description": "이직과 취업을 준비하는 청년을 위한 정부 지원 프로그램 탐색과 지원 현황 관리 서비스",
      "inLanguage": "ko"
    },
    {
      "@type": "Organization",
      "name": "For Youth",
      "url": "https://for-youth.site"
    }
  ]
}
```

---

## 섹션 6: 시맨틱 HTML 보완

현재 홈/programs/quiz 페이지에 `<h1>`이 없고 `<h2>`부터 시작됨. 검색엔진은 h1을 페이지 주제 파악에 활용.

**방식:** 시각적으로 숨긴 `<h1>` 추가 (`sr-only` 클래스) 또는 기존 h2 중 가장 중요한 것을 h1으로 승격.

| 페이지 | 추가할 h1 텍스트 |
|--------|----------------|
| `/` | "For Youth — 청년 취업·이직 준비 플랫폼" (sr-only) |
| `/programs` | "정책 둘러보기" (기존 h2 → h1 승격) |
| `/quiz` | "맞춤 프로그램 추천" (sr-only 또는 시각적 추가) |

---

## 구현 파일 목록

| 파일 | 작업 |
|------|------|
| `app/layout.tsx` | metadata 전면 교체 + JSON-LD script 추가 |
| `app/(home)/page.tsx` | 서버/클라이언트 분리 + metadata export + h1 추가 |
| `app/(home)/programs/page.tsx` | metadata export + h2→h1 승격 |
| `app/quiz/page.tsx` | metadata export + h1 추가 |
| `app/login/page.tsx` | metadata noindex |
| `app/(tabs)/layout.tsx` | metadata noindex |
| `app/sitemap.ts` | 신규 생성 |
| `app/robots.ts` | 신규 생성 |
| `app/opengraph-image.tsx` | 신규 생성 |

---

## 제외 범위

- Google Search Console 인증 태그 (인증 코드 발급 후 별도 1줄 추가)
- 개별 프로그램 상세 페이지 동적 메타데이터 (상세 페이지 없음)
- Core Web Vitals 최적화 (별도 작업)
