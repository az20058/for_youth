'use client';

import { useState } from 'react';
import { GraduationCap, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserProfile } from '@/lib/types';

interface EducationCareerProps {
  profile: UserProfile;
  onSave: (data: { school: string | null; major: string | null; careerLevel: string | null }) => Promise<void>;
}

const CAREER_LEVELS = ['신입', '1~3년', '3~5년', '5년 이상'];

export function EducationCareer({ profile, onSave }: EducationCareerProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    school: profile.school ?? '',
    major: profile.major ?? '',
    careerLevel: profile.careerLevel ?? '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        school: form.school.trim() || null,
        major: form.major.trim() || null,
        careerLevel: form.careerLevel || null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm({
      school: profile.school ?? '',
      major: profile.major ?? '',
      careerLevel: profile.careerLevel ?? '',
    });
    setEditing(false);
  }

  return (
    <section className="p-5 rounded-2xl bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-semibold">
          <GraduationCap className="size-4" />
          학력 &amp; 경력
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5 mr-1.5" />
            편집
          </Button>
        )}
      </div>
      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">학교</label>
            <input
              type="text"
              value={form.school}
              onChange={(e) => setForm({ ...form, school: e.target.value })}
              placeholder="학교명을 입력하세요"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">전공</label>
            <input
              type="text"
              value={form.major}
              onChange={(e) => setForm({ ...form, major: e.target.value })}
              placeholder="전공을 입력하세요"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">경력 수준</label>
            <select
              value={form.careerLevel}
              onChange={(e) => setForm({ ...form, careerLevel: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">선택하세요</option>
              {CAREER_LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave} disabled={saving}>저장</Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>취소</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">학교 / 전공</p>
            <p>
              {profile.school || profile.major
                ? [profile.school, profile.major].filter(Boolean).join(' ')
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">경력 수준</p>
            <p>{profile.careerLevel || '-'}</p>
          </div>
        </div>
      )}
    </section>
  );
}
