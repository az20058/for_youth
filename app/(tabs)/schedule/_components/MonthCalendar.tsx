'use client';

import { useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EVENT_TYPE_CONFIG, type ScheduleEvent } from './types';

interface MonthCalendarProps {
  month: Date;
  selectedDate: Date | undefined;
  events: ScheduleEvent[];
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function MonthCalendar({
  month,
  selectedDate,
  events,
  onMonthChange,
  onSelectDate,
}: MonthCalendarProps) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    const result: Date[] = [];
    let cursor = start;
    while (cursor <= end) {
      result.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return result;
  }, [month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const e of events) {
      const key = format(new Date(e.date), 'yyyy-MM-dd');
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMonthChange(addMonths(month, -1))}
          aria-label="이전 달"
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
        <h2 className="text-base sm:text-lg font-semibold">
          {format(month, 'yyyy년 M월', { locale: ko })}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMonthChange(addMonths(month, 1))}
          aria-label="다음 달"
        >
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 mb-1 sm:mb-2">
        {WEEKDAYS.map((label, i) => (
          <div
            key={label}
            className={`py-1.5 text-center text-[11px] sm:text-sm font-medium ${
              i === 0
                ? 'text-primary'
                : i === 6
                  ? 'text-blue-400'
                  : 'text-muted-foreground'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md bg-border/60">
        {days.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate.get(dayKey) ?? [];
          const outside = !isSameMonth(day, month);
          const today = isToday(day);
          const selected = selectedDate && isSameDay(day, selectedDate);
          const weekday = day.getDay();

          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => onSelectDate(day)}
              className={`group relative flex min-h-[72px] flex-col bg-card p-1 text-left transition-colors hover:bg-muted/40 sm:min-h-[112px] sm:p-1.5 ${
                selected ? 'ring-2 ring-primary ring-inset' : ''
              }`}
            >
              <span
                className={`inline-flex size-6 items-center justify-center self-center rounded-full text-xs font-medium sm:size-7 sm:self-start sm:text-sm ${
                  today
                    ? 'bg-primary text-primary-foreground'
                    : outside
                      ? 'text-muted-foreground/40'
                      : weekday === 0
                        ? 'text-primary'
                        : weekday === 6
                          ? 'text-blue-400'
                          : 'text-foreground'
                }`}
              >
                {day.getDate()}
              </span>

              <div className="mt-1 flex flex-col gap-0.5 sm:mt-1.5">
                {dayEvents.slice(0, 2).map((e) => {
                  const cfg = EVENT_TYPE_CONFIG[e.type];
                  return (
                    <span
                      key={e.id}
                      className={`truncate rounded-[3px] px-1 py-px text-[10px] leading-tight sm:text-xs ${cfg.bar} ${
                        outside ? 'opacity-50' : ''
                      }`}
                      title={`[${cfg.label}] ${e.title}`}
                    >
                      <span className="hidden sm:inline">[{cfg.label}] </span>
                      {e.title}
                    </span>
                  );
                })}
                {dayEvents.length > 2 && (
                  <span className="px-1 text-[10px] text-muted-foreground sm:text-xs">
                    +{dayEvents.length - 2}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
