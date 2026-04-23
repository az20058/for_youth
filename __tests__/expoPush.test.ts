import { sendExpoPush, chunk } from '@/lib/expoPush';

beforeEach(() => { global.fetch = jest.fn(); });

describe('chunk', () => {
  it('N개 단위로 배열을 쪼갠다', () => {
    expect(chunk([1,2,3,4,5], 2)).toEqual([[1,2],[3,4],[5]]);
    expect(chunk([], 10)).toEqual([]);
  });
});

describe('sendExpoPush', () => {
  it('Expo Push API를 호출하고 응답 티켓을 반환한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: [{ status: 'ok', id: 'tkt1' }] }) });
    const tickets = await sendExpoPush([{ to: 'ExponentPushToken[x]', title: 't', body: 'b', data: {} }]);
    expect(fetch).toHaveBeenCalledWith('https://exp.host/--/api/v2/push/send', expect.objectContaining({ method: 'POST' }));
    expect(tickets).toEqual([{ status: 'ok', id: 'tkt1' }]);
  });
  it('빈 배열이면 호출하지 않고 빈 배열 반환', async () => {
    const tickets = await sendExpoPush([]);
    expect(fetch).not.toHaveBeenCalled();
    expect(tickets).toEqual([]);
  });
  it('HTTP 실패 시 전체를 에러 티켓으로 변환', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) });
    const tickets = await sendExpoPush([{ to: 'x', title: 't', body: 'b' }]);
    expect(tickets).toEqual([{ status: 'error', details: { error: 'NetworkFailure' } }]);
  });
});
