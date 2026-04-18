import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return Response.json({ count });
}
