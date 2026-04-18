'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationItem } from '@/components/NotificationItem';
import { fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead } from '@/lib/notificationApi';
import type { Notification } from '@/lib/types';
import { useMediaQuery } from '@/lib/useMediaQuery';

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    refetchInterval: 30000,
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications', 'list'],
    queryFn: () => fetchNotifications(10, 0),
  });

  const readMutation = useMutation({
    mutationFn: (ids: string[]) => markAsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  function handleNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      readMutation.mutate([notification.id]);
    }
    if (notification.relatedId) {
      if (notification.type === '일정 알림') {
        router.push('/schedule');
      } else {
        router.push(`/applications/${notification.relatedId}`);
      }
    }
  }

  const bellButton = (
    <button type="button" className="relative p-1">
      <Bell className="size-5 text-muted-foreground hover:text-white transition-colors" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center size-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground border-2 border-background">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );

  if (!isDesktop) {
    return (
      <Link href="/notifications">
        {bellButton}
      </Link>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        {bellButton}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-semibold text-sm">알림</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => readAllMutation.mutate()}
              className="text-xs text-primary hover:underline"
            >
              모두 읽음
            </button>
          )}
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onClick={() => handleNotificationClick(n)}
              />
            ))
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              알림이 없습니다
            </div>
          )}
        </div>
        <div className="border-t border-border px-4 py-2.5 text-center">
          <Link href="/notifications" className="text-sm text-primary hover:underline">
            전체 알림 보기 →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
