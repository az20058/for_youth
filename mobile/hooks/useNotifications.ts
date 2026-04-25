import { useState, useEffect, useCallback } from 'react';
import {
  NotificationRow,
  getAllNotifications,
  upsertNotifications,
  markAsRead as dbMarkAsRead,
  markAllAsRead as dbMarkAllAsRead,
  getUnreadCount,
  initDB,
} from '../lib/db';
import { BASE_URL } from '../constants/config';

interface ApiNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedId: string | null;
  createdAt: string;
}

function toRow(n: ApiNotification): NotificationRow {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead ? 1 : 0,
    relatedId: n.relatedId,
    createdAt: n.createdAt,
  };
}

async function fetchNotificationsFromAPI(): Promise<NotificationRow[]> {
  const res = await fetch(`${BASE_URL}/api/notifications?limit=50&offset=0`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data: ApiNotification[] = await res.json();
  return data.map(toRow);
}

async function patchReadAPI(body: { all: true } | { ids: string[] }): Promise<void> {
  await fetch(`${BASE_URL}/api/notifications/read`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function readLocal() {
  return { rows: getAllNotifications(), count: getUnreadCount() };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationRow[]>(() => {
    initDB();
    return readLocal().rows;
  });
  const [unreadCount, setUnreadCount] = useState(() => readLocal().count);
  const [isLoading, setIsLoading] = useState(true);

  const refreshLocal = useCallback(() => {
    const { rows, count } = readLocal();
    setNotifications(rows);
    setUnreadCount(count);
  }, []);

  const syncFromAPI = useCallback(async () => {
    try {
      const rows = await fetchNotificationsFromAPI();
      upsertNotifications(rows);
      const { rows: updated, count } = readLocal();
      setNotifications(updated);
      setUnreadCount(count);
    } catch {
      // API failed — keep showing local data
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchNotificationsFromAPI()
      .then((rows) => {
        if (cancelled) return;
        upsertNotifications(rows);
        const { rows: updated, count } = readLocal();
        setNotifications(updated);
        setUnreadCount(count);
      })
      .catch(() => {
        // API failed — keep showing local data
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await syncFromAPI();
    setIsLoading(false);
  }, [syncFromAPI]);

  const markRead = useCallback(
    async (ids: string[]) => {
      dbMarkAsRead(ids);
      refreshLocal();
      try {
        await patchReadAPI({ ids });
      } catch {
        // ignore
      }
    },
    [refreshLocal],
  );

  const markAllRead = useCallback(async () => {
    dbMarkAllAsRead();
    refreshLocal();
    try {
      await patchReadAPI({ all: true });
    } catch {
      // ignore
    }
  }, [refreshLocal]);

  return { notifications, unreadCount, isLoading, refresh, markRead, markAllRead };
}
