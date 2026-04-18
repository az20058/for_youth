import { fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead } from '@/lib/notificationApi';

const mockNotification = {
  id: 'n1', type: '마감 임박' as const, title: '마감 임박: 네이버',
  message: 'D-1 | 내일 마감입니다', isRead: false, relatedId: 'app1',
  createdAt: '2026-04-18T00:00:00.000Z',
};

beforeEach(() => { global.fetch = jest.fn(); });

describe('fetchNotifications', () => {
  it('알림 목록을 조회한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve([mockNotification]) });
    const result = await fetchNotifications(10, 0);
    expect(result).toEqual([mockNotification]);
    expect(fetch).toHaveBeenCalledWith('/api/notifications?limit=10&offset=0');
  });
});

describe('fetchUnreadCount', () => {
  it('읽지 않은 알림 수를 반환한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ count: 3 }) });
    const count = await fetchUnreadCount();
    expect(count).toBe(3);
  });
});

describe('markAsRead', () => {
  it('특정 알림을 읽음 처리한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true });
    await markAsRead(['n1', 'n2']);
    expect(fetch).toHaveBeenCalledWith('/api/notifications/read', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ['n1', 'n2'] }),
    });
  });
});

describe('markAllAsRead', () => {
  it('모든 알림을 읽음 처리한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true });
    await markAllAsRead();
    expect(fetch).toHaveBeenCalledWith('/api/notifications/read', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
  });
});
