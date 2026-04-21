'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TagInput } from './TagInput';
import type { UserProfile } from '@/lib/types';

interface CertPortfolioProps {
  profile: UserProfile;
  onSave: (data: { certifications: string[]; portfolioUrl: string | null }) => Promise<void>;
}

export function CertPortfolio({ profile, onSave }: CertPortfolioProps) {
  const [editing, setEditing] = useState(false);
  const [certs, setCerts] = useState<string[]>(profile.certifications);
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolioUrl ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        certifications: certs,
        portfolioUrl: portfolioUrl.trim() || null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setCerts(profile.certifications);
    setPortfolioUrl(profile.portfolioUrl ?? '');
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">자격증</label>
          <TagInput tags={certs} onChange={setCerts} placeholder="자격증 입력 후 Enter" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">포트폴리오 URL</label>
          <input
            type="url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="https://github.com/username"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
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
        <p className="text-muted-foreground mb-2">자격증</p>
        <div className="flex flex-wrap gap-2">
          {profile.certifications.length > 0 ? (
            profile.certifications.map((cert) => (
              <span key={cert} className="rounded-full bg-emerald-950 border border-emerald-800 px-3 py-1 text-emerald-300">
                {cert}
              </span>
            ))
          ) : (
            <p className="text-muted-foreground">자격증을 추가해보세요</p>
          )}
        </div>
      </div>
      <div>
        <p className="text-muted-foreground mb-1">포트폴리오</p>
        {profile.portfolioUrl ? (
          <a
            href={profile.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            {profile.portfolioUrl}
            <ExternalLink className="size-3" />
          </a>
        ) : (
          <p className="text-muted-foreground">포트폴리오 링크를 추가해보세요</p>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="mb-2">
        편집
      </Button>
    </div>
  );
}
