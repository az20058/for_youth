'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FlameLoading } from '@/components/ui/flame-loading';
import { NotificationItem } from '@/components/NotificationItem';
import { fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead } from '@/lib/notificationApi';
import type { Notification } from '@/lib/types';

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
  });

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<Notification[]>({
    queryKey: ['notifications', 'infinite'],
    queryFn: ({ pageParam }) => fetchNotifications(PAGE_SIZE, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
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
    switch (notification.type) {
      case '신규 맞춤 정책':
        router.push('/programs');
        return;
      case '일정 알림':
        router.push('/schedule');
        return;
      case '마감 임박':
      case '상태 변경':
        if (notification.relatedId) {
          router.push(`/applications/${notification.relatedId}`);
        }
        return;
    }
  }

  const notifications = data?.pages.flat() ?? [];

  if (isLoading) {
    return <FlameLoading />;
  }

  return (
    <div className="py-4">
      <div className="flex items-center gap-3 mb-4">
        <button type="button" onClick={() => router.back()}>
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-semibold">알림</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => readAllMutation.mutate()}
            className="ml-auto text-xs text-primary hover:underline"
          >
            모두 읽음
          </button>
        )}
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {notifications.length > 0 ? (
          <>
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onClick={() => handleNotificationClick(n)}
              />
            ))}
            {hasNextPage && (
              <div className="py-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? '불러오는 중...' : '더 보기'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            알림이 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
