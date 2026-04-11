'use client';

import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { EVENT_TYPE_CONFIG, type ScheduleEvent } from './types';

interface AddEventDialogProps {
  selectedDate?: Date;
  onAdd: (event: { title: string; date: string; type: ScheduleEvent['type']; memo: string }) => void;
}

export function AddEventDialog({ selectedDate, onAdd }: AddEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | undefined>(selectedDate);
  const [type, setType] = useState<ScheduleEvent['type']>('CODING_TEST');
  const [memo, setMemo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    onAdd({
      title,
      date: date.toISOString(),
      type,
      memo,
    });

    setTitle('');
    setDate(selectedDate);
    setType('CODING_TEST');
    setMemo('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <PlusIcon className="size-4" />
          일정 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90%] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 일정 추가</DialogTitle>
          <DialogDescription>코딩테스트, 면접 등 일정을 등록하세요.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 삼성전자 코딩테스트"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">날짜</label>
            <DatePicker value={date} onChange={setDate} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">유형</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(EVENT_TYPE_CONFIG) as [ScheduleEvent['type'], typeof EVENT_TYPE_CONFIG[ScheduleEvent['type']]][])
                .filter(([key]) => key !== 'DEADLINE')
                .map(([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setType(key)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      type === key
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <span className={`size-2.5 rounded-full ${config.dot}`} />
                    {config.label}
                  </button>
                ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">메모 (선택)</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="추가 메모..."
              rows={2}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          </div>

          <Button type="submit" disabled={!title || !date}>
            추가하기
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
