'use client';

import { useMemo, useState } from 'react';
import { format, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EVENT_TYPE_CONFIG, type ScheduleEvent } from './types';

interface ScheduleListViewProps {
  events: ScheduleEvent[];
  onDelete: (id: string) => void;
  onAddForDate: (date: Date) => void;
}

interface DateGroup {
  dateKey: string;
  date: Date;
  events: ScheduleEvent[];
}

export function ScheduleListView({ events, onDelete, onAddForDate }: ScheduleListViewProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

  function handleDeleteConfirm() {
    if (pendingDeleteId) {
      onDelete(pendingDeleteId);
      setPendingDeleteId(null);
    }
  }

  function toggleCollapse(dateKey: string) {
    setCollapsedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  }

  const dateGroups = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const event of events) {
      const key = format(new Date(event.date), 'yyyy-MM-dd');
      const arr = map.get(key) ?? [];
      arr.push(event);
      map.set(key, arr);
    }

    const groups: DateGroup[] = [];
    for (const [dateKey, dateEvents] of map) {
      groups.push({
        dateKey,
        date: new Date(dateKey),
        events: dateEvents.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),
      });
    }

    return groups.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events]);

  if (dateGroups.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        이번 달 일정이 없습니다.
      </div>
    );
  }

  return (
    <>
      <Dialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>일정 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            이 일정을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteId(null)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-4">
        {dateGroups.map(({ dateKey, date, events: dateEvents }) => {
          const today = isToday(date);
          const collapsed = collapsedDates.has(dateKey);

          return (
            <div key={dateKey} className="overflow-hidden rounded-xl border border-border">
              <button
                type="button"
                onClick={() => toggleCollapse(dateKey)}
                className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors ${
                  today
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted/50 text-foreground'
                }`}
              >
                <h3 className="text-sm font-semibold">
                  {format(date, 'd일 EEEE', { locale: ko })}
                  {today && (
                    <span className="ml-1.5 text-xs font-medium">(오늘)</span>
                  )}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {dateEvents.length}건
                  </span>
                </h3>
                <div className="flex items-center gap-1">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddForDate(date);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        onAddForDate(date);
                      }
                    }}
                    className="inline-flex size-6 items-center justify-center rounded-md transition-colors hover:bg-foreground/10"
                    aria-label="일정 추가"
                  >
                    <PlusIcon className="size-4" />
                  </span>
                  {collapsed ? (
                    <ChevronDownIcon className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronUpIcon className="size-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {!collapsed && (
                <div className="divide-y divide-border bg-card">
                  {dateEvents.map((event) => {
                    const config = EVENT_TYPE_CONFIG[event.type];
                    return (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        <span
                          className={`size-2 shrink-0 rounded-full ${config.dot}`}
                        />
                        <div className="flex flex-1 items-center gap-2 min-w-0">
                          <Badge
                            variant="outline"
                            className={`shrink-0 text-[11px] px-1.5 py-0 ${config.color}`}
                          >
                            {config.label}
                          </Badge>
                          <span className="truncate text-sm">{event.title}</span>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {format(new Date(event.date), 'yy.MM.dd')}
                        </span>
                        {event.source === 'auto' && (
                          <Badge
                            variant="outline"
                            className="shrink-0 text-[11px] px-1.5 py-0 text-yellow-400"
                          >
                            자동
                          </Badge>
                        )}
                        {event.source === 'manual' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setPendingDeleteId(event.id)}
                          >
                            <Trash2Icon className="size-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
