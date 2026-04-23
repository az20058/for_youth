import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';

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

  const event = await prisma.scheduleEvent.create({
    data: {
      title,
      date: new Date(date),
      type,
      memo: memo || null,
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
