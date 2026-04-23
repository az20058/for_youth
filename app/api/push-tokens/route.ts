import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';

const TOKEN_RE = /^ExponentPushToken\[.+\]$/;

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }
  const body = (await request.json()) as { token?: unknown; platform?: unknown };
  const token = typeof body.token === 'string' ? body.token : '';
  const platform = body.platform === 'ios' || body.platform === 'android' ? body.platform : null;

  if (!TOKEN_RE.test(token)) {
    return Response.json({ message: '유효하지 않은 토큰입니다.' }, { status: 400 });
  }
  if (!platform) {
    return Response.json({ message: 'platform은 ios 또는 android여야 합니다.' }, { status: 400 });
  }

  await prisma.pushToken.upsert({
    where: { token },
    create: { token, platform, userId },
    update: { userId, platform, lastSeenAt: new Date() },
  });

  return Response.json({ success: true });
}
