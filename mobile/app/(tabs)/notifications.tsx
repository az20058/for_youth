import { FlatList, Text, View, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationItem } from '../../components/NotificationItem';
import { COLORS } from '../../constants/colors';
import type { NotificationRow } from '../../lib/db';

function navigateByType(notification: NotificationRow) {
  const { type } = notification;

  if (type === '신규 맞춤 정책') {
    router.navigate('/');
  } else if (type === '일정 알림') {
    router.navigate('/schedule');
  } else if (type === '마감 임박') {
    router.navigate('/applications');
  } else if (type === '상태 변경') {
    router.navigate('/applications');
  } else {
    router.navigate('/');
  }
}

export default function NotificationsScreen() {
  const { notifications, unreadCount, isLoading, refresh, markRead, markAllRead } =
    useNotifications();

  const handlePress = (notification: NotificationRow) => {
    if (notification.isRead === 0) {
      markRead([notification.id]);
    }
    navigateByType(notification);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>알림</Text>
        {unreadCount > 0 && (
          <Pressable onPress={markAllRead} hitSlop={8}>
            <Text style={styles.markAllRead}>모두 읽음</Text>
          </Pressable>
        )}
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem notification={item} onPress={handlePress} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={COLORS.textSecondary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>알림이 없습니다</Text>
            </View>
          ) : null
        }
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  markAllRead: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
});
