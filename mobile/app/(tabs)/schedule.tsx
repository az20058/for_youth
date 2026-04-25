import { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { MonthCalendar } from '../../components/calendar/MonthCalendar';
import { EventList } from '../../components/calendar/EventList';
import { AddEventSheet } from '../../components/calendar/AddEventSheet';
import { useScheduleApi } from '../../hooks/useScheduleApi';
import { COLORS } from '../../constants/colors';

function formatDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ScheduleTab() {
  const {
    events,
    isLoading,
    selectedDate,
    setSelectedDate,
    currentMonth,
    goNextMonth,
    goPrevMonth,
    addEvent,
    deleteEvent,
    toggleComplete,
  } = useScheduleApi();

  const [sheetVisible, setSheetVisible] = useState(false);

  const selectedDateKey = formatDateKey(selectedDate);

  const eventsForSelectedDate = useMemo(
    () =>
      events.filter((ev) => {
        const d = new Date(ev.date);
        return formatDateKey(d) === selectedDateKey;
      }),
    [events, selectedDateKey],
  );

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MonthCalendar
        events={events}
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        onPrevMonth={goPrevMonth}
        onNextMonth={goNextMonth}
      />

      <View style={styles.divider} />

      {/* Selected date label */}
      <View style={styles.dateHeader}>
        <Text style={styles.dateHeaderText}>
          {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
        </Text>
        {isLoading && (
          <ActivityIndicator size="small" color={COLORS.textSecondary} />
        )}
      </View>

      {/* Event list */}
      <View style={styles.listContainer}>
        <EventList
          events={eventsForSelectedDate}
          onDelete={deleteEvent}
          onToggleComplete={toggleComplete}
        />
      </View>

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => setSheetVisible(true)}
      >
        <Plus size={28} color={COLORS.textPrimary} />
      </Pressable>

      {/* Add event sheet */}
      <AddEventSheet
        visible={sheetVisible}
        selectedDate={selectedDate}
        onClose={() => setSheetVisible(false)}
        onSubmit={addEvent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  dateHeaderText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
