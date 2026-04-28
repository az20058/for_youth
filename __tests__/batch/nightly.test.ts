/** @jest-environment node */
import { GET } from '@/app/api/batch/nightly/route';
import { prisma } from '@/lib/db';
import { fetchFromYouthApi } from '@/lib/youthApi';

jest.mock('@/lib/youthApi', () => ({ fetchFromYouthApi: jest.fn() }));
jest.mock('@/lib/db', () => ({
  prisma: {
    youthPolicy: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
    notification: { createMany: jest.fn() },
    $queryRaw: jest.fn(),
  },
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

import { NextRequest } from 'next/server';

const OLD_ENV = process.env;
beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...OLD_ENV, CRON_SECRET: 'test-secret' };
});
afterAll(() => { process.env = OLD_ENV; });

function cronReq(secret: string | null): NextRequest {
  const headers = new Headers();
  if (secret !== null) headers.set('authorization', `Bearer ${secret}`);
  return new NextRequest('http://x/api/batch/nightly', { headers });
}

describe('/api/batch/nightly auth', () => {
  it('CRON_SECRET 불일치 → 401', async () => {
    const res = await GET(cronReq('wrong'));
    expect(res.status).toBe(401);
  });
  it('Authorization 헤더 없음 → 401', async () => {
    const res = await GET(cronReq(null));
    expect(res.status).toBe(401);
  });
});

describe('/api/batch/nightly matching', () => {
  it('신규 정책 0건 → matched=0', async () => {
    (fetchFromYouthApi as jest.Mock).mockResolvedValue([]);
    (prisma.youthPolicy.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

    const res = await GET(cronReq('test-secret'));
    const body = await res.json();
    expect(body.matched).toBe(0);
    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });

  it('신규 정책 + 매칭 유저 → POLICY_MATCH 알림 생성', async () => {
    (fetchFromYouthApi as jest.Mock).mockResolvedValue([
      { id: 'P1', name: '서울 일자리', agency: 'S', mainCategory: '일자리', category: 'x',
        description: '서울 거주 청년 취업', zipCodes: '11000' },
    ]);
    (prisma.youthPolicy.findMany as jest.Mock)
      .mockResolvedValueOnce([]) // existing snapshot
      .mockResolvedValueOnce([   // new policy details
        { plcyNo: 'P1', name: '서울 일자리', agency: 'S', mainCategory: '일자리', category: 'x',
          description: '서울 거주 청년 취업', zipCodes: '11000' },
      ]);
    (prisma.youthPolicy.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
    (prisma.youthPolicy.createMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.youthPolicy.update as jest.Mock).mockResolvedValue({});
    (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([
      { userId: 'u1', answers: JSON.stringify({ need: ['employment'], region: '11' }) },
    ]);

    const res = await GET(cronReq('test-secret'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.matched).toBeGreaterThanOrEqual(1);
    expect(prisma.notification.createMany).toHaveBeenCalled();
    const call = (prisma.notification.createMany as jest.Mock).mock.calls[0][0];
    expect(call.skipDuplicates).toBe(true);
    expect(call.data[0]).toMatchObject({
      userId: 'u1',
      type: 'POLICY_MATCH',
      dedupeKey: expect.stringMatching(/^policy-new:u1:\d{4}-\d{2}-\d{2}$/),
    });
  });
});
