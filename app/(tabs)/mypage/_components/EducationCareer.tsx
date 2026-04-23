'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import type { CareerItem, EducationInfo, UserProfile } from '@/lib/types';

interface EducationCareerProps {
  profile: UserProfile;
  onSave: (data: { education: EducationInfo | null; careers: CareerItem[] }) => Promise<void>;
}

const inputCls =
  'h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring';

function toDate(s: string): Date | undefined {
  return s ? parseISO(s) : undefined;
}
function fromDate(d: Date | undefined): string {
  return d ? format(d, 'yyyy-MM-dd') : '';
}
function displayDate(s: string): string {
  return s ? format(parseISO(s), 'yyyy.MM') : '';
}

const emptyEducation = (): EducationInfo => ({
  school: '', major: '', startDate: '', endDate: '', gpa: '', gpaTotal: '',
});
const emptyCareer = (): CareerItem => ({
  company: '', position: '', role: '', startDate: '', endDate: '', isCurrent: false,
});

function CareerEditor({
  item,
  onChange,
  onRemove,
}: {
  item: CareerItem;
  onChange: (item: CareerItem) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <input
          className={`${inputCls} flex-1`}
          value={item.company}
          onChange={(e) => onChange({ ...item, company: e.target.value })}
          placeholder="기업명"
        />
        <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={onRemove}>
          <X className="size-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          className={inputCls}
          value={item.position}
          onChange={(e) => onChange({ ...item, position: e.target.value })}
          placeholder="직책"
        />
        <input
          className={inputCls}
          value={item.role}
          onChange={(e) => onChange({ ...item, role: e.target.value })}
          placeholder="직무"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <DatePicker
          value={toDate(item.startDate)}
          onChange={(d) => onChange({ ...item, startDate: fromDate(d) })}
          placeholder="입사일"
          granularity="month"
          className="h-8 text-sm px-2"
        />
        <DatePicker
          value={toDate(item.endDate)}
          onChange={(d) => onChange({ ...item, endDate: fromDate(d) })}
          placeholder="퇴사일"
          disabled={item.isCurrent}
          granularity="month"
          className="h-8 text-sm px-2"
        />
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={item.isCurrent}
          onChange={(e) =>
            onChange({ ...item, isCurrent: e.target.checked, endDate: e.target.checked ? '' : item.endDate })
          }
        />
        재직 중
      </label>
    </div>
  );
}

function CareerView({ item }: { item: CareerItem }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2 space-y-0.5">
      <p className="font-medium text-sm">{item.company}</p>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {item.position && <span>{item.position}</span>}
        {item.role && <span>{item.role}</span>}
      </div>
      <p className="text-xs text-muted-foreground">
        {displayDate(item.startDate)}
        {item.startDate && ' ~ '}
        {item.isCurrent ? '재직 중' : displayDate(item.endDate)}
      </p>
    </div>
  );
}

export function EducationCareer({ profile, onSave }: EducationCareerProps) {
  const [editing, setEditing] = useState(false);
  const [edu, setEdu] = useState<EducationInfo>(profile.education ?? emptyEducation());
  const [careers, setCareers] = useState<CareerItem[]>(profile.careers);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const eduData =
        edu.school || edu.major || edu.startDate || edu.endDate || edu.gpa ? edu : null;
      await onSave({ education: eduData, careers });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEdu(profile.education ?? emptyEducation());
    setCareers(profile.careers);
    setEditing(false);
  }

  function updateCareer(index: number, item: CareerItem) {
    setCareers((prev) => prev.map((c, i) => (i === index ? item : c)));
  }

  if (editing) {
    return (
      <div className="space-y-5">
        {/* 학력 */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">학력</label>
          <div className="border border-border rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                className={inputCls}
                value={edu.school}
                onChange={(e) => setEdu({ ...edu, school: e.target.value })}
                placeholder="학교명"
              />
              <input
                className={inputCls}
                value={edu.major}
                onChange={(e) => setEdu({ ...edu, major: e.target.value })}
                placeholder="전공"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <DatePicker
                value={toDate(edu.startDate)}
                onChange={(d) => setEdu({ ...edu, startDate: fromDate(d) })}
                placeholder="입학일"
                granularity="month"
          className="h-8 text-sm px-2"
              />
              <DatePicker
                value={toDate(edu.endDate)}
                onChange={(d) => setEdu({ ...edu, endDate: fromDate(d) })}
                placeholder="졸업일"
                granularity="month"
          className="h-8 text-sm px-2"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                className={`${inputCls} w-24`}
                value={edu.gpa}
                onChange={(e) => setEdu({ ...edu, gpa: e.target.value })}
                placeholder="학점"
              />
              <span className="text-sm text-muted-foreground shrink-0">/</span>
              <input
                className={`${inputCls} w-24`}
                value={edu.gpaTotal}
                onChange={(e) => setEdu({ ...edu, gpaTotal: e.target.value })}
                placeholder="총 학점"
              />
            </div>
          </div>
        </div>

        {/* 경력 */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">경력</label>
          {careers.map((career, i) => (
            <CareerEditor
              key={i}
              item={career}
              onChange={(item) => updateCareer(i, item)}
              onRemove={() => setCareers((prev) => prev.filter((_, idx) => idx !== i))}
            />
          ))}
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1"
            onClick={() => setCareers((prev) => [...prev, emptyCareer()])}
          >
            <Plus className="size-3.5" /> 경력 추가
          </Button>
        </div>

        <div className="flex gap-2 pb-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>저장</Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>취소</Button>
        </div>
      </div>
    );
  }

  const ed = profile.education;

  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-2">
        <p className="text-muted-foreground">학력</p>
        {ed ? (
          <div className="rounded-lg border border-border px-3 py-2 space-y-0.5">
            <p className="font-medium">{[ed.school, ed.major].filter(Boolean).join(' · ') || '-'}</p>
            <p className="text-xs text-muted-foreground">
              {displayDate(ed.startDate)}
              {ed.startDate && ed.endDate && ' ~ '}
              {displayDate(ed.endDate)}
            </p>
            {(ed.gpa || ed.gpaTotal) && (
              <p className="text-xs text-muted-foreground">
                학점 {ed.gpa}{ed.gpaTotal && ` / ${ed.gpaTotal}`}
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">학력을 추가해보세요</p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground">경력</p>
        {profile.careers.length > 0 ? (
          profile.careers.map((career, i) => <CareerView key={i} item={career} />)
        ) : (
          <p className="text-muted-foreground">경력을 추가해보세요</p>
        )}
      </div>

      <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="mb-2">
        편집
      </Button>
    </div>
  );
}
