'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CircleUserRound, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { UserProfile } from '@/lib/types';

interface ProfileHeaderProps {
  profile: UserProfile;
  onSave: (data: { bio: string | null }) => Promise<void>;
}

function calcReadiness(profile: UserProfile): number {
  const desired = [profile.desiredJob, profile.desiredIndustry, profile.desiredRegion].filter(Boolean).length / 3;
  const education = [profile.school, profile.major, profile.careerLevel].filter(Boolean).length / 3;
  const cert = (profile.certifications.length > 0 || !!profile.portfolioUrl) ? 1 : 0;
  return Math.round(((desired + education + cert) / 3) * 100);
}

export function ProfileHeader({ profile, onSave }: ProfileHeaderProps) {
  const [bioOpen, setBioOpen] = useState(false);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [saving, setSaving] = useState(false);

  const readiness = calcReadiness(profile);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ bio: bio.trim() || null });
      setBioOpen(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setBio(profile.bio ?? '');
    setBioOpen(false);
  }

  return (
    <>
      <section className="p-6 rounded-xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-4">
          {profile.image ? (
            <Image src={profile.image} alt="프로필" width={64} height={64} className="rounded-full shrink-0" />
          ) : (
            <CircleUserRound className="size-16 text-muted-foreground shrink-0" />
          )}
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-lg font-semibold">{profile.name ?? '사용자'}</p>
            {profile.email && <p className="text-sm text-muted-foreground">{profile.email}</p>}
            <button
              type="button"
              onClick={() => setBioOpen(true)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="size-3" />
              {profile.bio ? (
                <span className="italic">&quot;{profile.bio}&quot;</span>
              ) : (
                <span>한줄 자기소개를 추가해보세요</span>
              )}
            </button>
          </div>
        </div>

        {/* 준비도 게이지 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">불씨 준비도</span>
            <span className="text-primary font-semibold">{readiness}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${readiness}%` }}
            />
          </div>
        </div>
      </section>

      <Dialog open={bioOpen} onOpenChange={setBioOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>한줄 자기소개</DialogTitle>
          </DialogHeader>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="나를 한 줄로 소개해보세요"
            maxLength={100}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={handleCancel}>취소</Button>
            <Button onClick={handleSave} disabled={saving}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
