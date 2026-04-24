import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

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

/* ---------- Rate Limiting ---------- */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_MAX_BATCH = 5;

const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? headers.get('x-real-ip')
    ?? '127.0.0.1';
}

function isRateLimited(key: string, max: number): boolean {
  const now = Date.now();
  const entry = ipRequestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    ipRequestCounts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > max;
}

// 오래된 항목 정리 (메모리 누수 방지)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of ipRequestCounts) {
      if (now > entry.resetAt) ipRequestCounts.delete(key);
    }
  }, RATE_LIMIT_WINDOW_MS);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // API rate limiting
  if (pathname.startsWith('/api/')) {
    const ip = getRateLimitKey(req.headers);
    const max = pathname.startsWith('/api/batch/') ? RATE_LIMIT_MAX_BATCH : RATE_LIMIT_MAX;
    if (isRateLimited(pathname.startsWith('/api/batch/') ? `batch:${ip}` : ip, max)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
  }

  // 보호된 페이지 인증 체크
  if (isProtected(pathname) && !req.auth) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon\\.ico|icons/).*)',
  ],
};
