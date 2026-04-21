'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { UserProfile } from '@/lib/types';

interface DesiredConditionsProps {
  profile: UserProfile;
  onSave: (data: { desiredJob: string | null; desiredIndustry: string | null; desiredRegion: string | null }) => Promise<void>;
}

export function DesiredConditions({ profile, onSave }: DesiredConditionsProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    desiredJob: profile.desiredJob ?? '',
    desiredIndustry: profile.desiredIndustry ?? '',
    desiredRegion: profile.desiredRegion ?? '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        desiredJob: form.desiredJob.trim() || null,
        desiredIndustry: form.desiredIndustry.trim() || null,
        desiredRegion: form.desiredRegion.trim() || null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm({
      desiredJob: profile.desiredJob ?? '',
      desiredIndustry: profile.desiredIndustry ?? '',
      desiredRegion: profile.desiredRegion ?? '',
    });
    setEditing(false);
  }

  const fields = [
    { key: 'desiredJob' as const, label: '희망 직무' },
    { key: 'desiredIndustry' as const, label: '희망 업종' },
    { key: 'desiredRegion' as const, label: '희망 지역' },
  ];

  if (editing) {
    return (
      <div className="space-y-3">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <label className="text-sm text-muted-foreground mb-1 block">{label}</label>
            <input
              type="text"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={`${label}을 입력하세요`}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        ))}
        <div className="flex gap-2 pt-1 pb-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>저장</Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>취소</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-3">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <p className="text-muted-foreground mb-1">{label}</p>
            <p>{profile[key] || '-'}</p>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="mb-2">
        편집
      </Button>
    </div>
  );
}
