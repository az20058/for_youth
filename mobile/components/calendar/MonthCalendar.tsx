import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import type { ScheduleEvent } from '../../hooks/useScheduleApi';

const EVENT_TYPE_COLORS: Record<ScheduleEvent['type'], string> = {
  DEADLINE: '#EF4444',
  DOCUMENT: '#EF4444',
  CODING_TEST: '#3B82F6',
  INTERVIEW: '#8B5CF6',
  OTHER: '#6B7280',
};

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

interface DayCellData {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  dots: string[]; // colors
}

interface MonthCalendarProps {
  events: ScheduleEvent[];
  currentMonth: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function generateCalendarDays(
  month: Date,
  today: Date,
  selected: Date,
  eventsByDate: Map<string, string[]>,
): DayCellData[] {
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1);
  const startDow = firstDay.getDay(); // 0=Sunday
  const daysInMonth = new Date(year, m + 1, 0).getDate();

  const cells: DayCellData[] = [];

  // Previous month fill
  const prevMonthDays = new Date(year, m, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const date = new Date(year, m - 1, day);
    cells.push({
      date,
      day,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      isSelected: isSameDay(date, selected),
      dots: (eventsByDate.get(formatDateKey(date)) ?? []).slice(0, 2),
    });
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, m, day);
    cells.push({
      date,
      day,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      isSelected: isSameDay(date, selected),
      dots: (eventsByDate.get(formatDateKey(date)) ?? []).slice(0, 2),
    });
  }

  // Next month fill (fill to 42 cells = 6 rows)
  const remaining = 42 - cells.length;
  for (let day = 1; day <= remaining; day++) {
    const date = new Date(year, m + 1, day);
    cells.push({
      date,
      day,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      isSelected: isSameDay(date, selected),
      dots: (eventsByDate.get(formatDateKey(date)) ?? []).slice(0, 2),
    });
  }

  return cells;
}

const DayCell = React.memo(function DayCell({
  data,
  onPress,
}: {
  data: DayCellData;
  onPress: (date: Date) => void;
}) {
  const textOpacity = data.isCurrentMonth ? 1 : 0.3;

  return (
    <Pressable style={styles.dayCell} onPress={() => onPress(data.date)}>
      <View
        style={[
          styles.dayNumberWrap,
          data.isToday && styles.todayBg,
          data.isSelected && !data.isToday && styles.selectedRing,
          data.isSelected && data.isToday && styles.selectedTodayRing,
        ]}
      >
        <Text
          style={[
            styles.dayNumber,
            { opacity: textOpacity },
            data.isToday && styles.todayText,
          ]}
        >
          {data.day}
        </Text>
      </View>
      <View style={styles.dotsRow}>
        {data.dots.map((color, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: color, opacity: textOpacity },
            ]}
          />
        ))}
      </View>
    </Pressable>
  );
});

export function MonthCalendar({
  events,
  currentMonth,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: MonthCalendarProps) {
  const today = useMemo(() => new Date(), []);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const ev of events) {
      const d = new Date(ev.date);
      const key = formatDateKey(d);
      const colors = map.get(key) ?? [];
      colors.push(EVENT_TYPE_COLORS[ev.type]);
      map.set(key, colors);
    }
    return map;
  }, [events]);

  const days = useMemo(
    () => generateCalendarDays(currentMonth, today, selectedDate, eventsByDate),
    [currentMonth, today, selectedDate, eventsByDate],
  );

  const monthLabel = `${currentMonth.getFullYear()}년 ${currentMonth.getMonth() + 1}월`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onPrevMonth} hitSlop={12}>
          <ChevronLeft size={24} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable onPress={onNextMonth} hitSlop={12}>
          <ChevronRight size={24} color={COLORS.textPrimary} />
        </Pressable>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekRow}>
        {WEEK_DAYS.map((label, i) => (
          <View key={label} style={styles.weekDayCell}>
            <Text
              style={[
                styles.weekDayText,
                i === 0 && styles.sundayText,
              ]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {days.map((d, i) => (
          <DayCell key={i} data={d} onPress={onSelectDate} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  monthLabel: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  sundayText: {
    color: '#EF4444',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 44,
  },
  dayNumberWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayBg: {
    backgroundColor: COLORS.primary,
  },
  selectedRing: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  selectedTodayRing: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.textPrimary,
  },
  todayText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  dayNumber: {
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
    height: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
