'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AddEventDialog } from './_components/AddEventDialog';
import { EventList } from './_components/EventList';
import { MonthCalendar } from './_components/MonthCalendar';
import { useSchedule } from './_components/useSchedule';
import { ScheduleSkeleton } from './_components/ScheduleSkeleton';

export default function ScheduleCalendarPage() {
  const {
    currentMonth,
    setCurrentMonth,
    selectedDate,
    setSelectedDate,
    addDialogOpen,
    setAddDialogOpen,
    addDialogDate,
    setAddDialogDate,
    events,
    isLoading,
    isFetching,
    addMutation,
    deleteMutation,
  } = useSchedule();

  const month = currentMonth.getMonth() + 1;

  return (
    <main>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">일정 관리</h1>
        <AddEventDialog
          selectedDate={addDialogDate}
          onAdd={(event) => addMutation.mutate(event)}
          open={addDialogOpen}
          onOpenChange={(open) => {
            setAddDialogOpen(open);
            if (!open) setAddDialogDate(selectedDate);
          }}
        />
      </div>

      {isLoading ? (
        <ScheduleSkeleton />
      ) : (
        <>
          <div className={`rounded-xl border border-border bg-card p-3 sm:p-4 mb-6 transition-opacity duration-200 ${isFetching ? 'opacity-60 pointer-events-none' : ''}`}>
            <MonthCalendar
              month={currentMonth}
              selectedDate={selectedDate}
              events={events}
              onMonthChange={setCurrentMonth}
              onSelectDate={setSelectedDate}
            />
          </div>

          <div className="mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {selectedDate
                ? format(selectedDate, 'M월 d일 (EEEE)', { locale: ko })
                : `${month}월 전체 일정`}
            </h2>
          </div>

          <div className={`transition-opacity duration-200 ${isFetching ? 'opacity-60' : ''}`}>
            <EventList
              events={events}
              selectedDate={selectedDate}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          </div>
        </>
      )}
    </main>
  );
}
