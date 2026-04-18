import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/types';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 border-b border-border transition-colors hover:bg-muted/50',
        !notification.isRead && 'bg-primary/5',
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-1.5 shrink-0">
          {!notification.isRead && (
            <div className="size-2 rounded-full bg-primary" />
          )}
          {notification.isRead && <div className="size-2" />}
        </div>
        <div className="min-w-0">
          <p className={cn('text-sm font-medium', notification.isRead && 'text-muted-foreground')}>
            {notification.title}
          </p>
          <p className={cn('text-xs mt-0.5', notification.isRead ? 'text-muted-foreground/60' : 'text-muted-foreground')}>
            {notification.message}
          </p>
          <p className={cn('text-xs mt-1', notification.isRead ? 'text-muted-foreground/40' : 'text-muted-foreground/60')}>
            {timeAgo(notification.createdAt)}
          </p>
        </div>
      </div>
    </button>
  );
}
