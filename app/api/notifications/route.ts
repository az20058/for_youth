import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';
import { NOTIFICATION_TYPE_FROM_DB } from '@/lib/enumMaps';

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 10, 50);
  const offset = Math.min(Math.max(Number(searchParams.get('offset')) || 0, 0), 10000);

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  return Response.json(
    notifications.map((n) => ({
      id: n.id,
      type: NOTIFICATION_TYPE_FROM_DB[n.type],
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      relatedId: n.relatedId,
      createdAt: n.createdAt.toISOString(),
    })),
  );
}
