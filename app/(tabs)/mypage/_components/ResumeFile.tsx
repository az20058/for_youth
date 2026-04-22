'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileOrLinkInput } from './FileOrLinkInput';
import type { UserProfile } from '@/lib/types';

interface ResumeFileProps {
  profile: UserProfile;
  onSave: (data: { resumeUrl: string | null }) => Promise<void>;
}

export function ResumeFile({ profile, onSave }: ResumeFileProps) {
  const [editing, setEditing] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(profile.resumeUrl);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ resumeUrl });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setResumeUrl(profile.resumeUrl);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">이력서 (PDF 또는 링크)</label>
          <FileOrLinkInput value={resumeUrl} onChange={setResumeUrl} />
        </div>
        <div className="flex gap-2 pb-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>저장</Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>취소</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="text-muted-foreground mb-1">이력서</p>
        {profile.resumeUrl ? (
          <a
            href={profile.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline inline-flex items-center gap-1 truncate max-w-full"
          >
            <span className="truncate">{profile.resumeUrl}</span>
          </a>
        ) : (
          <p className="text-muted-foreground">이력서를 등록해보세요</p>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="mb-2">
        편집
      </Button>
    </div>
  );
}
