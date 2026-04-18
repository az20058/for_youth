'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, ListIcon } from 'lucide-react';
import { FlameLoading } from '@/components/ui/flame-loading';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AddEventDialog } from './_components/AddEventDialog';
import { EventList } from './_components/EventList';
import { MonthCalendar } from './_components/MonthCalendar';
import { ScheduleListView } from './_components/ScheduleListView';
import { type ScheduleEvent } from './_components/types';

export default function SchedulePage() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogDate, setAddDialogDate] = useState<Date | undefined>(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  const { data, isLoading, isFetching } = useQuery<{ events: ScheduleEvent[] }>({
    queryKey: ['schedule', year, month],
    queryFn: async () => {
      const res = await fetch(`/api/schedule?year=${year}&month=${month}`);
      if (!res.ok) throw new Error('Failed to fetch schedule');
      return res.json();
    },
    placeholderData: (prev) => prev,
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

  function handleAddForDate(date: Date) {
    setAddDialogDate(date);
    setAddDialogOpen(true);
  }

  return (
    <main className="py-8">
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
        <FlameLoading />
      ) : (
        <Tabs defaultValue="calendar">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="calendar" className="flex-1 gap-1.5">
              <CalendarIcon className="size-4" />
              달력
            </TabsTrigger>
            <TabsTrigger value="list" className="flex-1 gap-1.5">
              <ListIcon className="size-4" />
              목록
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
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
          </TabsContent>

          <TabsContent value="list">
            <div className={`transition-opacity duration-200 ${isFetching ? 'opacity-60' : ''}`}>
              <ScheduleListView
                events={events}
                onDelete={(id) => deleteMutation.mutate(id)}
                onAddForDate={handleAddForDate}
              />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}
