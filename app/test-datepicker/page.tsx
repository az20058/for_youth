'use client';
import { useState } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const inputClass = 'w-full rounded-lg bg-muted/50 px-3 py-2 text-sm ring-1 ring-foreground/10';

export default function TestPage() {
  const [date, setDate] = useState<Date | undefined>();
  const [size, setSize] = useState('');
  return (
    <main className="py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-6">새 지원서 추가</h1>
      <form className="mb-8 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">회사명</label>
            <input className={inputClass} placeholder="회사명" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">경력</label>
            <input className={inputClass} placeholder="신입 / 경력 N년" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">마감일</label>
            <DatePicker value={date} onChange={setDate} placeholder="마감일 선택" disablePast />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">기업 규모</label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger className="w-full h-9"><SelectValue placeholder="선택" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="대기업">대기업</SelectItem>
                <SelectItem value="스타트업">스타트업</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">채용 공고 URL (선택)</label>
            <input className={inputClass} type="url" placeholder="https://..." />
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <Button type="button" variant="outline">질문 추가</Button>
          <Button type="submit">저장</Button>
        </div>
      </form>
    </main>
  );
}
