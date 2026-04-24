import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function PATCH(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json();

  if (body.all === true) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  } else if (Array.isArray(body.ids) && body.ids.length > 0) {
    if (body.ids.length > 100) {
      return Response.json({ message: '한 번에 최대 100개까지 처리할 수 있습니다.' }, { status: 400 });
    }
    const validIds = body.ids.filter((id: unknown) => typeof id === 'string' && id.length < 50);
    await prisma.notification.updateMany({
      where: { id: { in: validIds }, userId },
      data: { isRead: true },
    });
  } else {
    return Response.json({ message: 'ids 또는 all 파라미터가 필요합니다.' }, { status: 400 });
  }

  return Response.json({ success: true });
}
