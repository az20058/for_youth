import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/db';
import { todayKstStart, addDays, isSameKstDay } from '@/lib/dateKst';
import { isEventCompleted } from '@/lib/scheduleCompletion';
import { sendExpoPush, chunk, type ExpoPushMessage, type ExpoPushTicket } from '@/lib/expoPush';

export const maxDuration = 300;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = req.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  if (authHeader.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = todayKstStart();
  const d1 = addDays(today, 1);
  const d3 = addDays(today, 3);
  const d1End = addDays(d1, 1);
  const d3End = addDays(d3, 1);

  const events = await prisma.scheduleEvent.findMany({
    where: {
      OR: [
        { date: { gte: d1, lt: d1End } },
        { date: { gte: d3, lt: d3End } },
      ],
    },
    include: { application: { select: { status: true } } },
  });

  const scheduleRows = events
    .filter((e) => !isEventCompleted(
      { completedAt: e.completedAt, type: e.type },
      e.application ? { status: e.application.status } : null,
    ))
    .map((e) => {
      const dMinus = isSameKstDay(e.date, d1) ? 1 : 3;
      return {
        userId: e.userId,
        type: 'SCHEDULE' as const,
        title: `D-${dMinus} ${e.title}`,
        message: `${e.date.toISOString().slice(0, 10)} 예정된 일정이에요.`,
        relatedId: e.id,
        dedupeKey: `schedule:${e.id}:D-${dMinus}`,
      };
    });

  const apps = await prisma.application.findMany({
    where: {
      deletedAt: null,
      status: 'PENDING',
      OR: [
        { deadline: { gte: d1, lt: d1End } },
        { deadline: { gte: d3, lt: d3End } },
      ],
    },
    select: { id: true, userId: true, companyName: true, deadline: true },
  });

  const deadlineRows = apps
    .filter((a) => a.deadline !== null && a.userId)
    .map((a) => {
      const dMinus = isSameKstDay(a.deadline!, d1) ? 1 : 3;
      return {
        userId: a.userId!,
        type: 'DEADLINE' as const,
        title: `D-${dMinus} ${a.companyName} 서류 마감`,
        message: '지원서 마감이 임박했어요.',
        relatedId: a.id,
        dedupeKey: `app-deadline:${a.id}:D-${dMinus}`,
      };
    });

  if (scheduleRows.length + deadlineRows.length > 0) {
    await prisma.notification.createMany({
      data: [...scheduleRows, ...deadlineRows],
      skipDuplicates: true,
    });
  }

  const pending = await prisma.notification.findMany({
    where: { pushedAt: null },
    include: { user: { include: { pushTokens: true } } },
  });

  type MessageWithMeta = ExpoPushMessage & { _notificationId: string };
  const messagesWithMeta: MessageWithMeta[] = [];
  const tokenlessIds: string[] = [];

  for (const n of pending) {
    const tokens = n.user.pushTokens;
    if (tokens.length === 0) {
      tokenlessIds.push(n.id);
      continue;
    }
    for (const t of tokens) {
      messagesWithMeta.push({
        _notificationId: n.id,
        to: t.token,
        title: n.title,
        body: n.message,
        data: { notificationId: n.id, type: n.type, relatedId: n.relatedId },
        sound: 'default',
      });
    }
  }

  type Agg = { anyOk: boolean; deviceNotRegCount: number; total: number };
  const agg = new Map<string, Agg>();
  const deadTokens: string[] = [];

  if (messagesWithMeta.length > 0) {
    for (const batch of chunk(messagesWithMeta, 100)) {
      const tickets: ExpoPushTicket[] = await sendExpoPush(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        batch.map(({ _notificationId, ...m }) => m),
      );
      tickets.forEach((ticket, i) => {
        const nid = batch[i]._notificationId;
        const to = batch[i].to;
        const cur = agg.get(nid) ?? { anyOk: false, deviceNotRegCount: 0, total: 0 };
        cur.total += 1;
        if (ticket.status === 'ok') {
          cur.anyOk = true;
        } else if ((ticket as { details?: { error?: string } }).details?.error === 'DeviceNotRegistered') {
          cur.deviceNotRegCount += 1;
          deadTokens.push(to);
        }
        agg.set(nid, cur);
      });
    }
  }

  const markPushedIds: string[] = [...tokenlessIds];
  for (const [nid, a] of agg.entries()) {
    if (a.anyOk) markPushedIds.push(nid);
    else if (a.deviceNotRegCount === a.total) markPushedIds.push(nid);
  }

  const txOps: unknown[] = [];
  if (markPushedIds.length > 0) {
    txOps.push(prisma.notification.updateMany({
      where: { id: { in: markPushedIds } },
      data: { pushedAt: new Date() },
    }));
  }
  if (deadTokens.length > 0) {
    txOps.push(prisma.pushToken.deleteMany({ where: { token: { in: deadTokens } } }));
  }
  if (txOps.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.$transaction(txOps as any);
  }

  return NextResponse.json({
    created: scheduleRows.length + deadlineRows.length,
    pushed: markPushedIds.length,
    removedTokens: deadTokens.length,
  });
}
