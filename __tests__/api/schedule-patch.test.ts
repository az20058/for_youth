/** @jest-environment node */
import { PATCH } from '@/app/api/schedule/route';
import { prisma } from '@/lib/db';

jest.mock('@/lib/auth', () => ({ getAuthenticatedUserId: jest.fn() }));
jest.mock('@/lib/db', () => ({
  prisma: {
    scheduleEvent: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { getAuthenticatedUserId } from '@/lib/auth';
import { NextRequest } from 'next/server';

function req(id: string | null, body: unknown): NextRequest {
  const url = id ? `http://x/api/schedule?id=${id}` : 'http://x/api/schedule';
  return new NextRequest(url, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PATCH /api/schedule', () => {
  beforeEach(() => jest.clearAllMocks());

  it('미인증 → 401', async () => {
    (getAuthenticatedUserId as jest.Mock).mockResolvedValue(null);
    const res = await PATCH(req('evt1', { completed: true }));
    expect(res.status).toBe(401);
  });

  it('id 누락 → 400', async () => {
    (getAuthenticatedUserId as jest.Mock).mockResolvedValue('u1');
    const res = await PATCH(req(null, { completed: true }));
    expect(res.status).toBe(400);
  });

  it('소유자 아님 → 404', async () => {
    (getAuthenticatedUserId as jest.Mock).mockResolvedValue('u1');
    (prisma.scheduleEvent.findUnique as jest.Mock).mockResolvedValue({ id: 'evt1', userId: 'other' });
    const res = await PATCH(req('evt1', { completed: true }));
    expect(res.status).toBe(404);
  });

  it('completed=true → completedAt 세팅', async () => {
    (getAuthenticatedUserId as jest.Mock).mockResolvedValue('u1');
    (prisma.scheduleEvent.findUnique as jest.Mock).mockResolvedValue({ id: 'evt1', userId: 'u1' });
    (prisma.scheduleEvent.update as jest.Mock).mockResolvedValue({});
    const res = await PATCH(req('evt1', { completed: true }));
    expect(res.status).toBe(200);
    expect(prisma.scheduleEvent.update).toHaveBeenCalledWith({
      where: { id: 'evt1' },
      data: { completedAt: expect.any(Date) },
    });
  });

  it('completed=false → completedAt null', async () => {
    (getAuthenticatedUserId as jest.Mock).mockResolvedValue('u1');
    (prisma.scheduleEvent.findUnique as jest.Mock).mockResolvedValue({ id: 'evt1', userId: 'u1' });
    (prisma.scheduleEvent.update as jest.Mock).mockResolvedValue({});
    const res = await PATCH(req('evt1', { completed: false }));
    expect(res.status).toBe(200);
    expect(prisma.scheduleEvent.update).toHaveBeenCalledWith({
      where: { id: 'evt1' },
      data: { completedAt: null },
    });
  });
});
