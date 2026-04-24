import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';

const VALID_EVENT_TYPES = ['CODING_TEST', 'INTERVIEW', 'DOCUMENT', 'OTHER'] as const;
const MAX_TITLE_LENGTH = 200;
const MAX_MEMO_LENGTH = 2000;

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const [scheduleEvents, applications] = await Promise.all([
    prisma.scheduleEvent.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.application.findMany({
      where: {
        userId,
        deletedAt: null,
        deadline: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        companyName: true,
        deadline: true,
        status: true,
      },
      orderBy: { deadline: 'asc' },
    }),
  ]);

  const deadlineEvents = applications
    .filter((app) => app.deadline !== null)
    .map((app) => ({
      id: `app-${app.id}`,
      title: `${app.companyName} 마감`,
      date: app.deadline!.toISOString(),
      type: 'DEADLINE' as const,
      source: 'auto' as const,
      status: app.status,
    }));

  const manualEvents = scheduleEvents.map((event) => ({
    id: event.id,
    title: event.title,
    date: event.date.toISOString(),
    type: event.type,
    memo: event.memo,
    source: 'manual' as const,
    completedAt: event.completedAt?.toISOString() ?? null,
  }));

  return NextResponse.json({ events: [...deadlineEvents, ...manualEvents] });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, date, type, memo, applicationId } = body;

  if (!title || !date || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (typeof title !== 'string' || title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json({ error: `제목은 ${MAX_TITLE_LENGTH}자 이하여야 합니다.` }, { status: 400 });
  }

  if (!VALID_EVENT_TYPES.includes(type)) {
    return NextResponse.json({ error: '유효하지 않은 일정 유형입니다.' }, { status: 400 });
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: '유효하지 않은 날짜입니다.' }, { status: 400 });
  }

  if (memo && (typeof memo !== 'string' || memo.length > MAX_MEMO_LENGTH)) {
    return NextResponse.json({ error: `메모는 ${MAX_MEMO_LENGTH}자 이하여야 합니다.` }, { status: 400 });
  }

  // applicationId가 제공된 경우 소유권 확인
  if (applicationId) {
    const app = await prisma.application.findFirst({
      where: { id: applicationId, userId, deletedAt: null },
      select: { id: true },
    });
    if (!app) {
      return NextResponse.json({ error: '지원서를 찾을 수 없습니다.' }, { status: 404 });
    }
  }

  const event = await prisma.scheduleEvent.create({
    data: {
      title: title.trim(),
      date: parsedDate,
      type,
      memo: memo?.trim() || null,
      userId,
      applicationId: applicationId || null,
    },
  });

  return NextResponse.json({ event }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing event id' }, { status: 400 });
  }

  const event = await prisma.scheduleEvent.findUnique({ where: { id } });
  if (!event || event.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.scheduleEvent.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing event id' }, { status: 400 });
  }
  const body = (await request.json()) as { completed?: unknown };
  const completed = body.completed === true;

  const event = await prisma.scheduleEvent.findUnique({ where: { id } });
  if (!event || event.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.scheduleEvent.update({
    where: { id },
    data: { completedAt: completed ? new Date() : null },
  });
  return NextResponse.json({ success: true });
}
