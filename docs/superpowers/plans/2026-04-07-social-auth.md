# Social Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google + Kakao social login with JWT sessions, protecting all routes except the main page.

**Architecture:** NextAuth.js v5 with Prisma adapter on Neon PostgreSQL. JWT session strategy with `proxy.ts` (Next.js 16) for server-side route protection and `AuthGuard` for client-side. Login page at `/login` with EMBER dark theme.

**Tech Stack:** NextAuth.js v5, @auth/prisma-adapter, Prisma 7.x, Next.js 16, React 19

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `lib/auth.ts` | NextAuth config (providers, JWT callbacks, adapter) |
| Create | `app/api/auth/[...nextauth]/route.ts` | NextAuth API handler |
| Create | `proxy.ts` | Server-side route protection |
| Create | `app/login/page.tsx` | Login page UI |
| Create | `components/AuthGuard.tsx` | Client-side session guard |
| Modify | `prisma/schema.prisma` | Add User, Account models; Application.userId |
| Modify | `app/providers.tsx` | Wrap with SessionProvider |
| Modify | `components/ui/header.tsx` | Session-aware profile button |
| Modify | `app/api/applications/route.ts` | Filter by userId |
| Modify | `app/api/applications/[id]/route.ts` | Verify userId ownership |
| Modify | `app/(tabs)/layout.tsx` | Wrap children with AuthGuard |

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install NextAuth v5 and Prisma adapter**

```bash
npm install next-auth@beta @auth/prisma-adapter
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('next-auth'); console.log('next-auth OK')"
node -e "require('@auth/prisma-adapter'); console.log('adapter OK')"
```

Expected: Both print OK without errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install next-auth v5 and prisma adapter"
```

---

### Task 2: Update Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add User and Account models, update Application**

Add the following models to `prisma/schema.prisma`:

```prisma
model User {
  id            String        @id @default(cuid())
  name          String?
  email         String?       @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  applications  Application[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
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

Add `userId` to the existing `Application` model:

```prisma
model Application {
  // ... existing fields ...
  userId       String?
  user         User?             @relation(fields: [userId], references: [id])
  // ... existing relations ...
}
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add-auth-models
```

Expected: Migration succeeds, new tables `User` and `Account` created, `Application` gets nullable `userId` column.

- [ ] **Step 3: Generate Prisma client**

```bash
npx prisma generate
```

Expected: Client regenerated with new models.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ lib/generated/
git commit -m "feat: add User and Account models for auth"
```

---

### Task 3: Create NextAuth config

**Files:**
- Create: `lib/auth.ts`

- [ ] **Step 1: Create auth config file**

```ts
// lib/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Kakao from 'next-auth/providers/kakao';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Kakao({
      clientId: process.env.AUTH_KAKAO_ID!,
      clientSecret: process.env.AUTH_KAKAO_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
```

- [ ] **Step 2: Add environment variable placeholders to `.env.example`**

Append to `.env.example`:

```
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_KAKAO_ID=
AUTH_KAKAO_SECRET=
```

- [ ] **Step 3: Add AUTH_SECRET to `.env`**

Generate a secret and add to `.env`:

```bash
npx auth secret
```

This appends `AUTH_SECRET` to `.env`.

- [ ] **Step 4: Commit**

```bash
git add lib/auth.ts .env.example
git commit -m "feat: configure NextAuth with Google and Kakao providers"
```

---

### Task 4: Create NextAuth API route handler

**Files:**
- Create: `app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create the catch-all route**

```ts
// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
```

- [ ] **Step 2: Verify route works**

```bash
npm run dev
```

Visit `http://localhost:3000/api/auth/providers` — should return JSON with `google` and `kakao` providers.

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/
git commit -m "feat: add NextAuth API route handler"
```

---

### Task 5: Create proxy.ts for route protection

**Files:**
- Create: `proxy.ts` (project root)

- [ ] **Step 1: Create proxy.ts**

```ts
// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

const protectedPaths = [
  '/quiz',
  '/applications',
  '/cover-letters',
];

function isProtected(pathname: string): boolean {
  return protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (isProtected(pathname) && !req.auth) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}) as (req: NextRequest) => Promise<NextResponse>;

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon\\.ico|icons/).*)',
  ],
};
```

> **Note:** NextAuth v5의 `auth()` 래퍼는 미들웨어 함수를 반환합니다. Next.js 16에서 `proxy.ts`는 `middleware.ts`와 동일하게 default export를 인식하므로, `export default auth(...)` 형태로 사용합니다.

- [ ] **Step 2: Verify protected route redirects**

Run dev server. Navigate to `/applications` while logged out.
Expected: Redirect to `/login?callbackUrl=/applications`.

- [ ] **Step 3: Commit**

```bash
git add proxy.ts
git commit -m "feat: add proxy.ts for route protection"
```

---

### Task 6: Add SessionProvider to providers

**Files:**
- Modify: `app/providers.tsx`

- [ ] **Step 1: Wrap children with SessionProvider**

```ts
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SessionProvider } from 'next-auth/react'
import { useState } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/providers.tsx
git commit -m "feat: wrap app with NextAuth SessionProvider"
```

---

### Task 7: Create login page

**Files:**
- Create: `app/login/page.tsx`

- [ ] **Step 1: Create login page component**

```tsx
// app/login/page.tsx
'use client';

import { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FlameIcon } from '@/components/icons/FlameIcon';
import { FlameLoading } from '@/components/ui/flame-loading';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <FlameLoading fullscreen />;
  }

  return (
    <div className="min-h-screen bg-[#1C1C1E] flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        {/* Logo */}
        <FlameIcon className="size-20" glow />
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold tracking-wide">EMBER</h1>
          <p className="text-[#9B9B9B] text-sm mt-1">청년을 위한 도전 플랫폼</p>
        </div>

        {/* Social Buttons */}
        <div className="flex flex-col gap-3 w-full mt-4">
          <Button
            className="w-full h-12 rounded-xl bg-white text-black hover:bg-gray-100 font-medium text-sm gap-2"
            onClick={() => signIn('google', { callbackUrl: '/' })}
          >
            <svg className="size-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google로 계속하기
          </Button>

          <Button
            className="w-full h-12 rounded-xl bg-[#FEE500] text-[#191919] hover:bg-[#FEE500]/90 font-medium text-sm gap-2"
            onClick={() => signIn('kakao', { callbackUrl: '/' })}
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="#191919">
              <path d="M12 3C6.48 3 2 6.36 2 10.44c0 2.62 1.75 4.93 4.37 6.24l-1.12 4.16a.3.3 0 0 0 .45.33l4.7-3.1c.52.07 1.05.1 1.6.1 5.52 0 10-3.36 10-7.73C22 6.36 17.52 3 12 3z" />
            </svg>
            Kakao로 계속하기
          </Button>
        </div>

        {/* Footer */}
        <p className="text-[#9B9B9B] text-xs text-center mt-4 leading-relaxed">
          로그인하면 EMBER의 이용약관 및<br />개인정보처리방침에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify login page renders**

Navigate to `http://localhost:3000/login`.
Expected: Dark page with FlameIcon, EMBER title, Google and Kakao buttons.

- [ ] **Step 3: Commit**

```bash
git add app/login/
git commit -m "feat: create social login page with Google and Kakao buttons"
```

---

### Task 8: Create AuthGuard component

**Files:**
- Create: `components/AuthGuard.tsx`

- [ ] **Step 1: Create AuthGuard**

```tsx
// components/AuthGuard.tsx
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FlameLoading } from '@/components/ui/flame-loading';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      alert('로그인이 필요합니다.');
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <FlameLoading fullscreen />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Wrap `(tabs)` layout with AuthGuard**

Modify `app/(tabs)/layout.tsx`:

```tsx
// app/(tabs)/layout.tsx
import { AppSidebar } from '@/components/AppSidebar';
import { MobileHeader } from '@/components/MobileHeader';
import { Header } from '@/components/ui/header';
import { AuthGuard } from '@/components/AuthGuard';
import { Toaster } from '@/components/ui/sonner';

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        <div className="sticky top-0 z-40">
          <Header />
        </div>
        <div className="flex flex-1">
          <AppSidebar />
          <div className="flex-1 min-w-0 flex flex-col">
            <MobileHeader />
            <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
              {children}
            </div>
          </div>
        </div>
        <Toaster position="top-right" />
      </div>
    </AuthGuard>
  );
}
```

- [ ] **Step 3: Verify guard works**

Navigate to `/applications` while logged out.
Expected: Brief loading screen, then alert "로그인이 필요합니다." and redirect to `/login`.

- [ ] **Step 4: Commit**

```bash
git add components/AuthGuard.tsx app/\(tabs\)/layout.tsx
git commit -m "feat: add AuthGuard to protect (tabs) routes"
```

---

### Task 9: Update Header with session-aware profile

**Files:**
- Modify: `components/ui/header.tsx`

- [ ] **Step 1: Update header to show session state**

```tsx
// components/ui/header.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { CircleUserRound, LogOut } from 'lucide-react';
import { FlameIcon } from '@/components/icons/FlameIcon';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'EMBER' }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-[#1C1C1E]">
      <Link href="/" className="flex items-center gap-2">
        <FlameIcon className="size-10" />
        <span className="text-white text-lg font-bold tracking-wide">
          {title}
        </span>
      </Link>
      {session?.user ? (
        <div className="flex items-center gap-2">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt="프로필"
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <CircleUserRound className="size-6 text-[#9B9B9B]" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: '/login' })}
            aria-label="로그아웃"
            className="rounded-full text-[#9B9B9B] hover:text-white hover:bg-[#3A3A3A]"
          >
            <LogOut className="size-5" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          asChild
          aria-label="로그인"
          className="rounded-full text-[#9B9B9B] hover:text-white hover:bg-[#3A3A3A]"
        >
          <Link href="/login">
            <CircleUserRound className="size-6" />
          </Link>
        </Button>
      )}
    </header>
  );
}
```

> **Note:** `'use client'`를 추가합니다 — `useSession` 훅 사용을 위해 필요합니다. 기존 `onProfileClick` prop은 제거합니다 (더 이상 불필요).

- [ ] **Step 2: Verify header renders correctly**

Logged out: Profile icon links to `/login`.
Logged in: Profile image + logout button visible.

- [ ] **Step 3: Commit**

```bash
git add components/ui/header.tsx
git commit -m "feat: session-aware header with profile and logout"
```

---

### Task 10: Protect API routes with userId

**Files:**
- Modify: `app/api/applications/route.ts`
- Modify: `app/api/applications/[id]/route.ts`

- [ ] **Step 1: Create auth helper for API routes**

Add to `lib/auth.ts` (append):

```ts
// lib/auth.ts (append)
import { NextResponse } from 'next/server';

export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
```

- [ ] **Step 2: Protect GET/POST in `app/api/applications/route.ts`**

Add userId filtering at the top of each handler:

```ts
// app/api/applications/route.ts
import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';
import { validateApplication, type NewApplicationData } from '@/lib/applicationValidation';
import {
  STATUS_FROM_DB,
  STATUS_TO_DB,
  SIZE_FROM_DB,
  SIZE_TO_DB,
  COVER_LETTER_TYPE_FROM_DB,
  COVER_LETTER_TYPE_TO_DB,
} from '@/lib/enumMaps';
import type { CoverLetterType } from '@/lib/types';

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const apps = await prisma.application.findMany({
    where: { userId },
    include: { coverLetters: true },
    orderBy: { createdAt: 'desc' },
  });

  return Response.json(
    apps.map((app) => ({
      id: app.id,
      companyName: app.companyName,
      careerLevel: app.careerLevel,
      deadline: app.deadline.toISOString(),
      companySize: SIZE_FROM_DB[app.companySize],
      status: STATUS_FROM_DB[app.status],
      url: app.url ?? undefined,
      coverLetters: app.coverLetters.map((cl) => ({
        id: cl.id,
        question: cl.question,
        answer: cl.answer,
        type: cl.type ? COVER_LETTER_TYPE_FROM_DB[cl.type] : null,
      })),
    })),
  );
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const data: NewApplicationData = await request.json();

  const errors = validateApplication(data);
  if (Object.keys(errors).length > 0) {
    return Response.json({ errors }, { status: 400 });
  }

  const app = await prisma.application.create({
    data: {
      companyName: data.companyName,
      careerLevel: data.careerLevel,
      deadline: new Date(data.deadline),
      companySize: SIZE_TO_DB[data.companySize as keyof typeof SIZE_TO_DB],
      status: STATUS_TO_DB[data.status as keyof typeof STATUS_TO_DB],
      url: data.url || null,
      userId,
      coverLetters: {
        createMany: {
          data: data.coverLetters.map((cl) => ({
            question: cl.question,
            answer: cl.answer,
            type: cl.type ? COVER_LETTER_TYPE_TO_DB[cl.type as CoverLetterType] : null,
          })),
        },
      },
    },
    include: { coverLetters: true },
  });

  return Response.json(
    {
      id: app.id,
      companyName: app.companyName,
      careerLevel: app.careerLevel,
      deadline: app.deadline.toISOString(),
      companySize: SIZE_FROM_DB[app.companySize],
      status: STATUS_FROM_DB[app.status],
      url: app.url ?? undefined,
      coverLetters: app.coverLetters.map((cl) => ({
        id: cl.id,
        question: cl.question,
        answer: cl.answer,
        type: cl.type ? COVER_LETTER_TYPE_FROM_DB[cl.type] : null,
      })),
    },
    { status: 201 },
  );
}
```

- [ ] **Step 3: Protect `app/api/applications/[id]/route.ts`**

Add userId check to all three handlers (GET, PATCH, DELETE):

```ts
// app/api/applications/[id]/route.ts
import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';
import {
  STATUS_FROM_DB,
  STATUS_TO_DB,
  SIZE_FROM_DB,
  SIZE_TO_DB,
  COVER_LETTER_TYPE_FROM_DB,
  COVER_LETTER_TYPE_TO_DB,
} from '@/lib/enumMaps';
import type { ApplicationStatus, CompanySize, CoverLetterType } from '@/lib/types';

function serializeApp(app: Awaited<ReturnType<typeof findApp>>) {
  if (!app) return null;
  return {
    id: app.id,
    companyName: app.companyName,
    careerLevel: app.careerLevel,
    deadline: app.deadline.toISOString(),
    companySize: SIZE_FROM_DB[app.companySize],
    status: STATUS_FROM_DB[app.status],
    url: app.url ?? undefined,
    coverLetters: app.coverLetters.map((cl) => ({
      id: cl.id,
      question: cl.question,
      answer: cl.answer,
      type: cl.type ? COVER_LETTER_TYPE_FROM_DB[cl.type] : null,
    })),
  };
}

function findApp(id: string, userId: string) {
  return prisma.application.findFirst({
    where: { id, userId },
    include: { coverLetters: true },
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });

  const { id } = await params;
  const app = await findApp(id, userId);
  if (!app) return Response.json({ message: '지원서를 찾을 수 없습니다.' }, { status: 404 });
  return Response.json(serializeApp(app));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });

  const { id } = await params;
  const body = await request.json() as {
    status?: ApplicationStatus;
    companySize?: CompanySize;
    companyName?: string;
    careerLevel?: string;
    deadline?: string;
    url?: string | null;
    coverLetters?: Array<{ id?: string; question: string; answer: string; type: CoverLetterType | null }>;
  };

  const app = await findApp(id, userId);
  if (!app) return Response.json({ message: '지원서를 찾을 수 없습니다.' }, { status: 404 });

  const updated = await prisma.application.update({
    where: { id },
    data: {
      ...(body.companyName !== undefined && { companyName: body.companyName }),
      ...(body.careerLevel !== undefined && { careerLevel: body.careerLevel }),
      ...(body.deadline !== undefined && { deadline: new Date(body.deadline) }),
      ...(body.companySize !== undefined && { companySize: SIZE_TO_DB[body.companySize] }),
      ...(body.status !== undefined && { status: STATUS_TO_DB[body.status] }),
      ...(body.url !== undefined && { url: body.url }),
      ...(body.coverLetters !== undefined && {
        coverLetters: {
          deleteMany: {},
          createMany: {
            data: body.coverLetters.map((cl) => ({
              question: cl.question,
              answer: cl.answer,
              type: cl.type ? COVER_LETTER_TYPE_TO_DB[cl.type] : null,
            })),
          },
        },
      }),
    },
    include: { coverLetters: true },
  });

  return Response.json(serializeApp(updated));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });

  const { id } = await params;
  const app = await findApp(id, userId);
  if (!app) return Response.json({ message: '지원서를 찾을 수 없습니다.' }, { status: 404 });
  await prisma.application.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/auth.ts app/api/applications/
git commit -m "feat: protect API routes with user authentication"
```

---

### Task 11: Add quiz route to AuthGuard coverage

**Files:**
- Create: `app/quiz/layout.tsx`

- [ ] **Step 1: Create quiz layout with AuthGuard**

Quiz is outside `(tabs)`, so it needs its own AuthGuard wrapper:

```tsx
// app/quiz/layout.tsx
import { AuthGuard } from '@/components/AuthGuard';

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
```

- [ ] **Step 2: Verify quiz is protected**

Navigate to `/quiz` while logged out.
Expected: Alert + redirect to `/login`.

- [ ] **Step 3: Commit**

```bash
git add app/quiz/layout.tsx
git commit -m "feat: protect quiz route with AuthGuard"
```

---

### Task 12: Final verification and lint

- [ ] **Step 1: Run lint on all modified files**

```bash
npx eslint lib/auth.ts app/api/auth/ proxy.ts app/providers.tsx app/login/page.tsx components/AuthGuard.tsx components/ui/header.tsx app/api/applications/ app/quiz/layout.tsx app/\(tabs\)/layout.tsx
```

Fix any errors.

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Fix any type errors.

- [ ] **Step 3: End-to-end manual verification**

1. Visit `/` — accessible without login, header shows login icon
2. Visit `/applications` — redirects to `/login`
3. Visit `/quiz` — redirects to `/login`
4. Visit `/programs` — accessible without login
5. Login with Google or Kakao
6. After login, header shows profile image + logout
7. Visit `/applications` — accessible, shows user's data
8. Click logout — redirects to `/login`

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: lint and type fixes for auth implementation"
```
