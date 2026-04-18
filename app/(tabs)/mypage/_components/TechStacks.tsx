'use client';

import { useState } from 'react';
import { Code, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TagInput } from './TagInput';
import type { UserProfile } from '@/lib/types';

interface TechStacksProps {
  profile: UserProfile;
  onSave: (data: { techStacks: string[] }) => Promise<void>;
}

export function TechStacks({ profile, onSave }: TechStacksProps) {
  const [editing, setEditing] = useState(false);
  const [tags, setTags] = useState<string[]>(profile.techStacks);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ techStacks: tags });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setTags(profile.techStacks);
    setEditing(false);
  }

  return (
    <section className="p-5 rounded-2xl bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-semibold">
          <Code className="size-4" />
          기술 스택
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
          <TagInput tags={tags} onChange={setTags} placeholder="기술 스택 입력 후 Enter" />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>저장</Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>취소</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {profile.techStacks.length > 0 ? (
            profile.techStacks.map((tech) => (
              <span key={tech} className="rounded-full bg-muted px-3 py-1 text-sm">
                {tech}
              </span>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">기술 스택을 추가해보세요</p>
          )}
        </div>
      )}
    </section>
  );
}
