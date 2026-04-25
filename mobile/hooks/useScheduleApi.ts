import { useState, useEffect, useCallback } from 'react';
import { BASE_URL, USER_AGENT } from '../constants/config';

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  type: 'DEADLINE' | 'CODING_TEST' | 'INTERVIEW' | 'DOCUMENT' | 'OTHER';
  source: 'auto' | 'manual';
  memo?: string | null;
  completedAt?: string | null;
}

interface AddEventData {
  title: string;
  date: string;
  type: ScheduleEvent['type'];
  memo?: string;
}

const headers = {
  'Content-Type': 'application/json',
  'User-Agent': USER_AGENT,
};

export function useScheduleApi() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const fetchEvents = useCallback(async (month: Date) => {
    setIsLoading(true);
    try {
      const year = month.getFullYear();
      const m = month.getMonth() + 1;
      const res = await fetch(
        `${BASE_URL}/api/schedule?year=${year}&month=${m}`,
        { headers },
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(currentMonth);
  }, [currentMonth, fetchEvents]);

  const goNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      return next;
    });
  }, []);

  const goPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      return next;
    });
  }, []);

  const addEvent = useCallback(async (data: AddEventData) => {
    const res = await fetch(`${BASE_URL}/api/schedule`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add event');
    const { event } = await res.json();
    setEvents((prev) => [...prev, event]);
    return event as ScheduleEvent;
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    const res = await fetch(`${BASE_URL}/api/schedule?id=${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw new Error('Failed to delete event');
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const toggleComplete = useCallback(async (id: string) => {
    const event = events.find((e) => e.id === id);
    if (!event) return;
    const completed = !event.completedAt;
    const res = await fetch(`${BASE_URL}/api/schedule?id=${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ completed }),
    });
    if (!res.ok) throw new Error('Failed to toggle');
    const { event: updated } = await res.json();
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updated } : e)),
    );
  }, [events]);

  const refresh = useCallback(() => {
    fetchEvents(currentMonth);
  }, [currentMonth, fetchEvents]);

  return {
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
    refresh,
  };
}
