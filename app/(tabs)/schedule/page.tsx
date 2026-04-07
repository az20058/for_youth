'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { FlameLoading } from '@/components/ui/flame-loading';
import { AddEventDialog } from './_components/AddEventDialog';
import { EventList } from './_components/EventList';
import { EVENT_TYPE_CONFIG, type ScheduleEvent } from './_components/types';

export default function SchedulePage() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  const { data, isLoading } = useQuery<{ events: ScheduleEvent[] }>({
    queryKey: ['schedule', year, month],
    queryFn: async () => {
      const res = await fetch(`/api/schedule?year=${year}&month=${month}`);
      if (!res.ok) throw new Error('Failed to fetch schedule');
      return res.json();
    },
  });

  const events = useMemo(() => data?.events ?? [], [data?.events]);

  const eventDatesMap = useMemo(() => {
    const map = new Map<string, ScheduleEvent['type'][]>();
    for (const event of events) {
      const key = format(new Date(event.date), 'yyyy-MM-dd');
      const types = map.get(key) || [];
      if (!types.includes(event.type)) types.push(event.type);
      map.set(key, types);
    }
    return map;
  }, [events]);

  const addMutation = useMutation({
    mutationFn: async (newEvent: { title: string; date: string; type: string; memo: string }) => {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      if (!res.ok) throw new Error('Failed to create event');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', year, month] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete event');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', year, month] });
    },
  });

  return (
    <main className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">일정 관리</h1>
        <AddEventDialog
          selectedDate={selectedDate}
          onAdd={(event) => addMutation.mutate(event)}
        />
      </div>

      {isLoading ? (
        <FlameLoading />
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-4 mb-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              locale={ko}
              className="w-full [--cell-size:auto]"
              components={{
                DayButton: ({ day, modifiers, ...props }) => {
                  const dateKey = format(day.date, 'yyyy-MM-dd');
                  const types = eventDatesMap.get(dateKey);

                  return (
                    <button
                      {...props}
                      className={`relative flex flex-col items-center justify-center w-full aspect-square rounded-md text-sm transition-colors ${
                        modifiers.selected
                          ? 'bg-primary text-primary-foreground'
                          : modifiers.today
                            ? 'bg-accent text-accent-foreground'
                            : modifiers.outside
                              ? 'text-muted-foreground/50'
                              : 'hover:bg-muted'
                      }`}
                    >
                      <span>{day.date.getDate()}</span>
                      {types && types.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {types.slice(0, 3).map((type) => (
                            <span
                              key={type}
                              className={`size-1.5 rounded-full ${EVENT_TYPE_CONFIG[type].dot}`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                },
              }}
            />
          </div>

          <div className="mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {selectedDate
                ? format(selectedDate, 'M월 d일 (EEEE)', { locale: ko })
                : `${month}월 전체 일정`}
            </h2>
          </div>

          <EventList
            events={events}
            selectedDate={selectedDate}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </>
      )}
    </main>
  );
}
