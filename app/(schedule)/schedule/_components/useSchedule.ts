'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ScheduleEvent } from './types';

export function useSchedule() {
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

  const patchMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const res = await fetch(`/api/schedule?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error('완료 상태 변경 실패');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', year, month] });
    },
    onError: () => {
      toast.error('완료 상태 변경에 실패했습니다.');
    },
  });

  function handleAddForDate(date: Date) {
    setAddDialogDate(date);
    setAddDialogOpen(true);
  }

  return {
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
    toggleComplete: patchMutation.mutate,
    handleAddForDate,
  };
}
