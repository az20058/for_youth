/** @jest-environment node */
import { POST } from '@/app/api/push-tokens/route';
import { prisma } from '@/lib/db';

jest.mock('@/lib/auth', () => ({ getAuthenticatedUserId: jest.fn() }));
jest.mock('@/lib/db', () => ({
  prisma: { pushToken: { upsert: jest.fn() } },
}));

import { getAuthenticatedUserId } from '@/lib/auth';

function req(body: unknown): Request {
  return new Request('http://x/api/push-tokens', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/push-tokens', () => {
  beforeEach(() => jest.clearAllMocks());

  it('미인증 → 401', async () => {
    (getAuthenticatedUserId as jest.Mock).mockResolvedValue(null);
    const res = await POST(req({ token: 'ExponentPushToken[x]', platform: 'ios' }));
    expect(res.status).toBe(401);
  });

  it('잘못된 토큰 포맷 → 400', async () => {
    (getAuthenticatedUserId as jest.Mock).mockResolvedValue('u1');
    const res = await POST(req({ token: 'invalid', platform: 'ios' }));
    expect(res.status).toBe(400);
  });

  it('잘못된 platform → 400', async () => {
    (getAuthenticatedUserId as jest.Mock).mockResolvedValue('u1');
    const res = await POST(req({ token: 'ExponentPushToken[abc]', platform: 'windows' }));
    expect(res.status).toBe(400);
  });

  it('정상 입력 → upsert 호출, 200', async () => {
    (getAuthenticatedUserId as jest.Mock).mockResolvedValue('u1');
    (prisma.pushToken.upsert as jest.Mock).mockResolvedValue({});
    const res = await POST(req({ token: 'ExponentPushToken[abc]', platform: 'ios' }));
    expect(res.status).toBe(200);
    expect(prisma.pushToken.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { token: 'ExponentPushToken[abc]' },
    }));
  });
});
