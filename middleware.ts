import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_MAX_BATCH = 5;

const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
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
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of ipRequestCounts) {
    if (now > entry.resetAt) ipRequestCounts.delete(key);
  }
}, RATE_LIMIT_WINDOW_MS);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 배치 API는 더 엄격한 rate limit
  if (pathname.startsWith('/api/batch/')) {
    const ip = getRateLimitKey(req);
    if (isRateLimited(`batch:${ip}`, RATE_LIMIT_MAX_BATCH)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
    return NextResponse.next();
  }

  // 일반 API rate limiting
  if (pathname.startsWith('/api/')) {
    const ip = getRateLimitKey(req);
    if (isRateLimited(ip, RATE_LIMIT_MAX)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
