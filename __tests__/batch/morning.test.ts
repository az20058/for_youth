/** @jest-environment node */
import { GET } from '@/app/api/batch/morning/route';
import { prisma } from '@/lib/db';
import { sendExpoPush } from '@/lib/expoPush';

jest.mock('@/lib/db', () => ({
  prisma: {
    scheduleEvent: { findMany: jest.fn() },
    application: { findMany: jest.fn() },
    notification: { createMany: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
    pushToken: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));
jest.mock('@/lib/expoPush', () => ({
  sendExpoPush: jest.fn(),
  chunk: jest.requireActual('@/lib/expoPush').chunk,
}));

import { NextRequest } from 'next/server';

const OLD_ENV = process.env;
beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...OLD_ENV, CRON_SECRET: 'morning-secret' };
  jest.useFakeTimers().setSystemTime(new Date('2026-04-23T00:00:00.000Z'));
  (prisma.$transaction as jest.Mock).mockResolvedValue([]);
  (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 0 });
  (prisma.scheduleEvent.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.application.findMany as jest.Mock).mockResolvedValue([]);
});
afterEach(() => jest.useRealTimers());
afterAll(() => { process.env = OLD_ENV; });

function cronReq(secret: string | null): NextRequest {
  const h = new Headers();
  if (secret !== null) h.set('authorization', `Bearer ${secret}`);
  return new NextRequest('http://x/api/batch/morning', { headers: h });
}

describe('/api/batch/morning auth', () => {
  it('시크릿 불일치 → 401', async () => {
    const res = await GET(cronReq('wrong'));
    expect(res.status).toBe(401);
  });
});

describe('/api/batch/morning D-3/D-1 생성', () => {
  it('D-1 ScheduleEvent + 미완료 → SCHEDULE 알림 생성', async () => {
    (prisma.scheduleEvent.findMany as jest.Mock).mockResolvedValue([
      { id: 'e1', userId: 'u1', title: '카카오 면접', type: 'INTERVIEW',
        date: new Date('2026-04-24T05:00:00.000Z'), completedAt: null, application: null },
    ]);
    const res = await GET(cronReq('morning-secret'));
    expect(res.status).toBe(200);
    const call = (prisma.notification.createMany as jest.Mock).mock.calls[0][0];
    expect(call.data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        userId: 'u1', type: 'SCHEDULE', relatedId: 'e1',
        title: expect.stringContaining('D-1'),
        dedupeKey: 'schedule:e1:D-1',
      }),
    ]));
  });

  it('completedAt 설정된 이벤트는 스킵', async () => {
    (prisma.scheduleEvent.findMany as jest.Mock).mockResolvedValue([
      { id: 'e1', userId: 'u1', title: '코테', type: 'CODING_TEST',
        date: new Date('2026-04-24T05:00:00.000Z'), completedAt: new Date(), application: null },
    ]);
    await GET(cronReq('morning-secret'));
    const calls = (prisma.notification.createMany as jest.Mock).mock.calls;
    const scheduleData = calls.flatMap((c: jest.Mock[]) => (c[0] as { data: { type: string }[] }).data.filter((r) => r.type === 'SCHEDULE'));
    expect(scheduleData).toEqual([]);
  });

  it('application.status가 INTERVIEW면 CODING_TEST 이벤트 스킵', async () => {
    (prisma.scheduleEvent.findMany as jest.Mock).mockResolvedValue([
      { id: 'e1', userId: 'u1', title: '코테', type: 'CODING_TEST',
        date: new Date('2026-04-24T05:00:00.000Z'), completedAt: null,
        application: { status: 'INTERVIEW' } },
    ]);
    await GET(cronReq('morning-secret'));
    const calls = (prisma.notification.createMany as jest.Mock).mock.calls;
    const scheduleData = calls.flatMap((c: jest.Mock[]) => (c[0] as { data: { type: string }[] }).data.filter((r) => r.type === 'SCHEDULE'));
    expect(scheduleData).toEqual([]);
  });

  it('Application.deadline D-3 + PENDING → DEADLINE 알림', async () => {
    (prisma.application.findMany as jest.Mock).mockResolvedValue([
      { id: 'app1', userId: 'u2', companyName: '삼성',
        deadline: new Date('2026-04-26T05:00:00.000Z'), status: 'PENDING' },
    ]);
    await GET(cronReq('morning-secret'));
    const call = (prisma.notification.createMany as jest.Mock).mock.calls[0][0];
    expect(call.data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        userId: 'u2', type: 'DEADLINE', relatedId: 'app1',
        title: expect.stringContaining('D-3'),
        dedupeKey: 'app-deadline:app1:D-3',
      }),
    ]));
  });
});

describe('/api/batch/morning push dispatch', () => {
  it('pushedAt NULL 알림 + 토큰이 있으면 Expo 호출', async () => {
    (prisma.notification.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'n1', userId: 'u1', type: 'SCHEDULE', title: 'D-1 면접', message: '내일이에요', relatedId: 'e1',
        user: { pushTokens: [{ token: 'ExponentPushToken[x]' }] },
      },
    ]);
    (sendExpoPush as jest.Mock).mockResolvedValue([{ status: 'ok', id: 'tkt' }]);
    await GET(cronReq('morning-secret'));
    expect(sendExpoPush).toHaveBeenCalledWith([expect.objectContaining({
      to: 'ExponentPushToken[x]', title: 'D-1 면접',
    })]);
  });

  it('DeviceNotRegistered 토큰 삭제 + 알림 pushedAt 마킹', async () => {
    (prisma.notification.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'n1', userId: 'u1', type: 'SCHEDULE', title: 't', message: 'm', relatedId: null,
        user: { pushTokens: [{ token: 'ExponentPushToken[dead]' }] },
      },
    ]);
    (sendExpoPush as jest.Mock).mockResolvedValue([{ status: 'error', details: { error: 'DeviceNotRegistered' } }]);
    await GET(cronReq('morning-secret'));
    expect(prisma.$transaction).toHaveBeenCalled();
    const txArgs = (prisma.$transaction as jest.Mock).mock.calls[0][0];
    expect(Array.isArray(txArgs)).toBe(true);
  });

  it('푸시 토큰 없는 유저 → pushedAt만 마킹, fetch 호출 없음', async () => {
    (prisma.notification.findMany as jest.Mock).mockResolvedValue([
      { id: 'n2', userId: 'u3', type: 'DEADLINE', title: 't', message: 'm', relatedId: 'app',
        user: { pushTokens: [] } },
    ]);
    await GET(cronReq('morning-secret'));
    expect(sendExpoPush).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
