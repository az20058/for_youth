'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FlameLoading } from '@/components/ui/flame-loading';
import { AddEventDialog } from './_components/AddEventDialog';
import { EventList } from './_components/EventList';
import { MonthCalendar } from './_components/MonthCalendar';
import { type ScheduleEvent } from './_components/types';

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
      toast.success('일정이 추가되었습니다.');
    },
    onError: () => {
      toast.error('일정 추가에 실패했습니다.');
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
      toast.success('일정이 삭제되었습니다.');
    },
    onError: () => {
      toast.error('일정 삭제에 실패했습니다.');
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
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 mb-6">
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
