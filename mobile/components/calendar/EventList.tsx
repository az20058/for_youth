import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { X, Check, Square } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import type { ScheduleEvent } from '../../hooks/useScheduleApi';

const EVENT_TYPE_COLORS: Record<ScheduleEvent['type'], string> = {
  DEADLINE: '#EF4444',
  DOCUMENT: '#EF4444',
  CODING_TEST: '#3B82F6',
  INTERVIEW: '#8B5CF6',
  OTHER: '#6B7280',
};

const EVENT_TYPE_LABELS: Record<ScheduleEvent['type'], string> = {
  DEADLINE: '마감',
  CODING_TEST: '코딩테스트',
  INTERVIEW: '면접',
  DOCUMENT: '서류',
  OTHER: '기타',
};

interface EventListProps {
  events: ScheduleEvent[];
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

function EventItem({
  item,
  onDelete,
  onToggleComplete,
}: {
  item: ScheduleEvent;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}) {
  const isCompleted = !!item.completedAt;
  const color = EVENT_TYPE_COLORS[item.type];

  return (
    <View style={[styles.eventItem, isCompleted && styles.eventItemCompleted]}>
      <Pressable
        style={styles.checkbox}
        onPress={() => onToggleComplete(item.id)}
        hitSlop={8}
      >
        {isCompleted ? (
          <Check size={18} color={COLORS.primary} />
        ) : (
          <Square size={18} color={COLORS.textSecondary} />
        )}
      </Pressable>

      <View style={styles.eventContent}>
        <View style={styles.eventTopRow}>
          <View style={styles.badgeRow}>
            <View style={[styles.typeDot, { backgroundColor: color }]} />
            <Text style={[styles.typeLabel, { color }]}>
              {EVENT_TYPE_LABELS[item.type]}
            </Text>
            {item.source === 'auto' && (
              <View style={styles.autoBadge}>
                <Text style={styles.autoBadgeText}>자동</Text>
              </View>
            )}
          </View>
          {item.source === 'manual' && (
            <Pressable
              onPress={() => onDelete(item.id)}
              hitSlop={8}
              style={styles.deleteBtn}
            >
              <X size={16} color={COLORS.textSecondary} />
            </Pressable>
          )}
        </View>

        <Text
          style={[
            styles.eventTitle,
            isCompleted && styles.eventTitleCompleted,
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>

        {item.memo ? (
          <Text style={styles.eventMemo} numberOfLines={1}>
            {item.memo}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function EventList({ events, onDelete, onToggleComplete }: EventListProps) {
  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>이 날짜에 일정이 없습니다</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <EventItem
          item={item}
          onDelete={onDelete}
          onToggleComplete={onToggleComplete}
        />
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  eventItemCompleted: {
    opacity: 0.5,
  },
  checkbox: {
    marginTop: 2,
  },
  eventContent: {
    flex: 1,
  },
  eventTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  autoBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  autoBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 2,
  },
  eventTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  eventTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  eventMemo: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
