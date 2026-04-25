import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS } from '../constants/colors';
import type { NotificationRow } from '../lib/db';

const TYPE_COLORS: Record<string, string> = {
  '마감 임박': '#EF4444',
  '일정 알림': '#3B82F6',
  '상태 변경': '#8B5CF6',
  '신규 맞춤 정책': '#10B981',
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  return `${months}개월 전`;
}

interface Props {
  notification: NotificationRow;
  onPress: (notification: NotificationRow) => void;
}

export function NotificationItem({ notification, onPress }: Props) {
  const badgeColor = TYPE_COLORS[notification.type] ?? COLORS.textSecondary;
  const isUnread = notification.isRead === 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={() => onPress(notification)}
    >
      {isUnread && <View style={styles.unreadDot} />}
      <View style={[styles.content, !isUnread && styles.contentRead]}>
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: badgeColor + '20' }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>
              {notification.type}
            </Text>
          </View>
          <Text style={styles.time}>
            {formatRelativeTime(notification.createdAt)}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.message} numberOfLines={1}>
          {notification.message}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pressed: {
    opacity: 0.7,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 6,
    marginRight: 10,
  },
  content: {
    flex: 1,
    marginLeft: 0,
  },
  contentRead: {
    marginLeft: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
