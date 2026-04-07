'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EVENT_TYPE_CONFIG, type ScheduleEvent } from './types';

interface EventListProps {
  events: ScheduleEvent[];
  selectedDate: Date | undefined;
  onDelete: (id: string) => void;
}

export function EventList({ events, selectedDate, onDelete }: EventListProps) {
  const filtered = selectedDate
    ? events.filter(
        (e) =>
          format(new Date(e.date), 'yyyy-MM-dd') ===
          format(selectedDate, 'yyyy-MM-dd'),
      )
    : events;

  const sorted = [...filtered].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  if (sorted.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        {selectedDate
          ? `${format(selectedDate, 'M월 d일', { locale: ko })}에 일정이 없습니다.`
          : '이번 달 일정이 없습니다.'}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((event) => {
        const config = EVENT_TYPE_CONFIG[event.type];
        return (
          <div
            key={event.id}
            className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
          >
            <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${config.dot}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{event.title}</span>
                <Badge variant="outline" className={`text-xs shrink-0 ${config.color}`}>
                  {config.label}
                </Badge>
                {event.source === 'auto' && (
                  <Badge variant="outline" className="text-xs shrink-0 text-yellow-400">
                    자동
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(event.date), 'M월 d일 (EEEE)', { locale: ko })}
              </div>
              {event.memo && (
                <p className="text-xs text-muted-foreground mt-1">{event.memo}</p>
              )}
            </div>
            {event.source === 'manual' && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(event.id)}
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
