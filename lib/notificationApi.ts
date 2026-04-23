import type { Notification } from './types';

export async function fetchNotifications(limit = 10, offset = 0): Promise<Notification[]> {
  const res = await fetch(`/api/notifications?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error('알림을 불러오지 못했습니다.');
  return res.json();
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await fetch('/api/notifications/unread-count');
  if (!res.ok) throw new Error('읽지 않은 알림 수를 불러오지 못했습니다.');
  const data: { count: number } = await res.json();
  return data.count;
}

export async function markAsRead(ids: string[]): Promise<void> {
  const res = await fetch('/api/notifications/read', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error('알림 읽음 처리에 실패했습니다.');
}

export async function markAllAsRead(): Promise<void> {
  const res = await fetch('/api/notifications/read', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ all: true }),
  });
  if (!res.ok) throw new Error('알림 전체 읽음 처리에 실패했습니다.');
}

export async function registerPushToken(info: { token: string; platform: 'ios' | 'android' }): Promise<void> {
  const res = await fetch('/api/push-tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(info),
  });
  if (!res.ok) throw new Error('푸시 토큰 등록 실패');
}
