# Social Authentication Design Spec

## Overview

EMBER 앱에 Google + Kakao 소셜 로그인을 추가한다. JWT 기반 세션, 자동 로그인, 메인 페이지 외 전체 보호.

## Tech Stack

- **NextAuth.js v5** (Auth.js) — OAuth 프로바이더 관리 + JWT 세션
- **@auth/prisma-adapter** — User/Account 모델 자동 연동
- **Prisma + Neon PostgreSQL** — 기존 DB 확장

## 1. DB Model (Prisma Schema)

### 새 모델

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  applications  Application[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}
```

### 기존 모델 수정

```prisma
model Application {
  // 기존 필드 유지
  userId String?
  user   User?   @relation(fields: [userId], references: [id])
}
```

- JWT 전략이므로 Session 테이블 불필요
- Application에 `userId` 추가 (nullable — 마이그레이션 호환)

## 2. Auth 설정

### `lib/auth.ts`

- `GoogleProvider` + `KakaoProvider` 등록
- `session: { strategy: "jwt" }` 설정
- `PrismaAdapter` 연결
- JWT 콜백: `token.sub` (userId)를 세션에 포함
- 로그인 성공 후 `/`로 리다이렉트

### `app/api/auth/[...nextauth]/route.ts`

- NextAuth 핸들러 GET/POST 위임
- `/api/auth/signin`, `/api/auth/callback/google`, `/api/auth/callback/kakao` 자동 생성

### 환경 변수

```
AUTH_SECRET=<random-secret>
AUTH_GOOGLE_ID=<google-client-id>
AUTH_GOOGLE_SECRET=<google-client-secret>
AUTH_KAKAO_ID=<kakao-rest-api-key>
AUTH_KAKAO_SECRET=<kakao-client-secret>
```

## 3. 라우트 보호

### `proxy.ts` (루트)

Next.js 16에서 middleware → proxy로 이름 변경됨.

```ts
export function proxy(request: NextRequest) {
  // JWT 토큰 검증
  // 미인증 + 보호 경로 → /login 리다이렉트
}

export const config = {
  matcher: [
    '/quiz/:path*',
    '/applications/:path*',
    '/cover-letters/:path*',
    '/api/applications/:path*',
  ],
}
```

### `components/AuthGuard.tsx` (클라이언트)

- `(tabs)` 레이아웃에 적용
- `useSession()`으로 세션 확인
- 미인증 → `alert("로그인이 필요합니다")` + `/login` 리다이렉트
- 로딩 중 → `<FlameLoading fullscreen />`

### 보호 범위

| 경로 | 보호 |
|------|------|
| `/` (메인) | 공개 |
| `/programs` | 공개 |
| `/login` | 공개 |
| `/quiz/*` | 보호 |
| `/applications/*` | 보호 |
| `/cover-letters/*` | 보호 |
| `/api/auth/*` | 공개 |
| `/api/applications/*` | 보호 |

## 4. 로그인 페이지 UI

### `app/login/page.tsx`

- 라우트 그룹 밖 독립 페이지
- 다크 테마 전체 화면 (`bg-[#1C1C1E]`)
- 중앙 정렬 레이아웃:
  - `FlameIcon` (size-20, glow 활성화)
  - "EMBER" 타이틀
  - "청년을 위한 도전 플랫폼" 서브텍스트
  - Google 로그인 버튼 (흰색 배경)
  - Kakao 로그인 버튼 (노란색 배경)
  - 하단 약관 동의 안내 텍스트
- 이미 로그인된 상태면 `/`로 자동 리다이렉트

## 5. 세션 연동 & 기존 코드 수정

### SessionProvider

- `app/providers.tsx`에 NextAuth `SessionProvider` 추가
- 클라이언트 컴포넌트에서 `useSession()` 사용 가능

### 헤더 프로필 버튼

- `components/ui/header.tsx` 수정
- 로그인됨: 프로필 이미지 표시 + 클릭 시 로그아웃
- 미로그인: 클릭 시 `/login` 이동

### API 라우트 보호

- `app/api/applications/route.ts`에서 세션의 userId 추출
- userId 없으면 `401 Unauthorized` 응답
- Application CRUD를 userId로 필터링

### 패키지 추가

- `next-auth@5` (beta)
- `@auth/prisma-adapter`

## 6. 파일 구조 요약

```
proxy.ts                              # 라우트 보호 (구 middleware)
lib/auth.ts                           # NextAuth 설정
app/api/auth/[...nextauth]/route.ts   # Auth API 핸들러
app/login/page.tsx                    # 로그인 페이지
components/AuthGuard.tsx              # 클라이언트 세션 가드
prisma/schema.prisma                  # User, Account 모델 추가
```
