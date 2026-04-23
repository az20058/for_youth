'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import type { CertItem, UserProfile } from '@/lib/types';

interface CertPortfolioProps {
  profile: UserProfile;
  onSave: (data: { certifications: CertItem[]; languages: CertItem[] }) => Promise<void>;
}

const emptyItem = (): CertItem => ({ name: '', issuer: '', date: '', number: '' });

const inputCls =
  'h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring';

function CertItemEditor({
  item,
  onChange,
  onRemove,
}: {
  item: CertItem;
  onChange: (item: CertItem) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <input
          className={`${inputCls} flex-1`}
          value={item.name}
          onChange={(e) => onChange({ ...item, name: e.target.value })}
          placeholder="명칭"
        />
        <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={onRemove}>
          <X className="size-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          className={inputCls}
          value={item.issuer}
          onChange={(e) => onChange({ ...item, issuer: e.target.value })}
          placeholder="발급기관"
        />
        <input
          className={inputCls}
          value={item.number}
          onChange={(e) => onChange({ ...item, number: e.target.value })}
          placeholder="자격번호"
        />
      </div>
      <DatePicker
        value={item.date ? parseISO(item.date) : undefined}
        onChange={(date) =>
          onChange({ ...item, date: date ? format(date, 'yyyy-MM-dd') : '' })
        }
        placeholder="취득일"
        granularity="month"
        className="h-8 text-sm"
      />
    </div>
  );
}

function CertItemView({ item }: { item: CertItem }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2 space-y-0.5">
      <p className="font-medium text-sm">{item.name}</p>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {item.issuer && <span>{item.issuer}</span>}
        {item.date && <span>{format(parseISO(item.date), 'yyyy.MM')}</span>}
        {item.number && <span>#{item.number}</span>}
      </div>
    </div>
  );
}

export function CertPortfolio({ profile, onSave }: CertPortfolioProps) {
  const [editing, setEditing] = useState(false);
  const [certs, setCerts] = useState<CertItem[]>(profile.certifications);
  const [languages, setLanguages] = useState<CertItem[]>(profile.languages);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ certifications: certs, languages });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setCerts(profile.certifications);
    setLanguages(profile.languages);
    setEditing(false);
  }

  function updateCert(index: number, item: CertItem) {
    setCerts((prev) => prev.map((c, i) => (i === index ? item : c)));
  }

  function updateLang(index: number, item: CertItem) {
    setLanguages((prev) => prev.map((l, i) => (i === index ? item : l)));
  }

  if (editing) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">자격증</label>
          {certs.map((cert, i) => (
            <CertItemEditor
              key={i}
              item={cert}
              onChange={(item) => updateCert(i, item)}
              onRemove={() => setCerts((prev) => prev.filter((_, idx) => idx !== i))}
            />
          ))}
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1"
            onClick={() => setCerts((prev) => [...prev, emptyItem()])}
          >
            <Plus className="size-3.5" /> 자격증 추가
          </Button>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">어학</label>
          {languages.map((lang, i) => (
            <CertItemEditor
              key={i}
              item={lang}
              onChange={(item) => updateLang(i, item)}
              onRemove={() => setLanguages((prev) => prev.filter((_, idx) => idx !== i))}
            />
          ))}
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1"
            onClick={() => setLanguages((prev) => [...prev, emptyItem()])}
          >
            <Plus className="size-3.5" /> 어학 추가
          </Button>
        </div>
        <div className="flex gap-2 pb-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>저장</Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>취소</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-2">
        <p className="text-muted-foreground">자격증</p>
        {certs.length > 0 ? (
          certs.map((cert, i) => <CertItemView key={i} item={cert} />)
        ) : (
          <p className="text-muted-foreground">자격증을 추가해보세요</p>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-muted-foreground">어학</p>
        {languages.length > 0 ? (
          languages.map((lang, i) => <CertItemView key={i} item={lang} />)
        ) : (
          <p className="text-muted-foreground">어학 자격을 추가해보세요</p>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="mb-2">
        편집
      </Button>
    </div>
  );
}
