'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CircleUserRound, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserProfile } from '@/lib/types';

interface ProfileHeaderProps {
  profile: UserProfile;
  onSave: (data: { bio: string | null }) => Promise<void>;
}

export function ProfileHeader({ profile, onSave }: ProfileHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ bio: bio.trim() || null });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setBio(profile.bio ?? '');
    setEditing(false);
  }

  return (
    <section className="flex items-center gap-4 p-6 rounded-2xl bg-card border border-border">
      {profile.image ? (
        <Image
          src={profile.image}
          alt="프로필"
          width={64}
          height={64}
          className="rounded-full shrink-0"
        />
      ) : (
        <CircleUserRound className="size-16 text-muted-foreground shrink-0" />
      )}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-lg font-semibold">{profile.name ?? '사용자'}</p>
        {profile.email && (
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        )}
        {editing ? (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="한줄 자기소개를 입력하세요"
              maxLength={100}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
            <Button size="sm" onClick={handleSave} disabled={saving}>
              저장
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              취소
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {profile.bio ? (
              <p className="text-sm text-muted-foreground italic">&quot;{profile.bio}&quot;</p>
            ) : (
              <p className="text-sm text-muted-foreground">한줄 자기소개를 추가해보세요</p>
            )}
          </div>
        )}
      </div>
      {!editing && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditing(true)}
          className="shrink-0"
        >
          <Pencil className="size-3.5 mr-1.5" />
          편집
        </Button>
      )}
    </section>
  );
}
