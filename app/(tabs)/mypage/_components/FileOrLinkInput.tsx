'use client';

import { useState, useRef } from 'react';
import { ExternalLink, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileOrLinkInputProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function FileOrLinkInput({ value, onChange }: FileOrLinkInputProps) {
  const [mode, setMode] = useState<'file' | 'link'>('file');
  const [linkInput, setLinkInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/user/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('업로드 실패');
      const { url } = await res.json();
      onChange(url);
    } catch {
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function handleLinkConfirm() {
    const trimmed = linkInput.trim();
    if (trimmed) onChange(trimmed);
  }

  if (value) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-sm text-blue-400 hover:underline inline-flex items-center gap-1 truncate"
        >
          <span className="truncate">{value}</span>
          <ExternalLink className="size-3 shrink-0" />
        </a>
        <button
          type="button"
          onClick={() => { onChange(null); setLinkInput(''); }}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => setMode('file')}
          className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
            mode === 'file' ? 'border-primary text-primary' : 'border-border text-muted-foreground'
          }`}
        >
          파일 업로드
        </button>
        <button
          type="button"
          onClick={() => setMode('link')}
          className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
            mode === 'link' ? 'border-primary text-primary' : 'border-border text-muted-foreground'
          }`}
        >
          링크 입력
        </button>
      </div>

      {mode === 'file' ? (
        <>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="gap-1.5"
          >
            <Upload className="size-3.5" />
            {uploading ? '업로드 중...' : 'PDF 선택'}
          </Button>
        </>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLinkConfirm(); }}
            placeholder="https://..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
          <Button type="button" size="sm" onClick={handleLinkConfirm}>확인</Button>
        </div>
      )}
    </div>
  );
}
