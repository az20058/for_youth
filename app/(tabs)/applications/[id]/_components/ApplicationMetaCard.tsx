"use client"

import { useState } from 'react'
import * as SelectPrimitive from "@radix-ui/react-select"
import { BriefcaseIcon, BuildingIcon, CircleDotIcon, ExternalLinkIcon, PencilIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'
import { statusBadgeClass } from '@/lib/statusBadge'
import type { ApplicationStatus } from '@/lib/types'

const STATUS_OPTIONS: ApplicationStatus[] = [
  '지원 예정', '코테 기간', '면접 기간', '지원 완료',
  '최종 합격', '서류 탈락', '코테 탈락', '면접 탈락',
]

interface ApplicationMetaCardProps {
  applicationId: string
  companyName: string
  careerLevel: string
  companySize: string
  initialStatus: ApplicationStatus
  initialDeadline: Date | null
  initialUrl: string | undefined
}

export function ApplicationMetaCard({
  applicationId,
  companyName,
  careerLevel,
  companySize,
  initialStatus,
  initialDeadline,
  initialUrl,
}: ApplicationMetaCardProps) {
  const [status, setStatus] = useState(initialStatus)
  const [deadline, setDeadline] = useState<Date | null>(initialDeadline)
  const [url, setUrl] = useState(initialUrl ?? '')
  const [editingUrl, setEditingUrl] = useState(false)
  const [urlInput, setUrlInput] = useState(initialUrl ?? '')

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/applications/${applicationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error('저장 실패')
  }

  async function handleStatusChange(newStatus: string) {
    const next = newStatus as ApplicationStatus
    const prev = status
    setStatus(next)
    try {
      await patch({ status: next })
    } catch {
      setStatus(prev)
      toast.error('상태 저장에 실패했습니다.')
    }
  }

  async function handleDeadlineChange(date: Date | undefined) {
    const prev = deadline
    const next = date ?? null
    setDeadline(next)
    try {
      await patch({ deadline: next ? next.toISOString().split('T')[0] : null })
    } catch {
      setDeadline(prev)
      toast.error('마감일 저장에 실패했습니다.')
    }
  }

  async function handleUrlSave() {
    const trimmed = urlInput.trim()
    const prev = url
    setUrl(trimmed)
    setEditingUrl(false)
    try {
      await patch({ url: trimmed || null })
    } catch {
      setUrl(prev)
      setUrlInput(prev)
      toast.error('URL 저장에 실패했습니다.')
    }
  }

  return (
    <div className="mb-8 rounded-2xl bg-card ring-1 ring-foreground/10 p-5 sm:p-6">
      <div className="flex flex-row items-start justify-between gap-3">
        <h1 className="min-w-0 flex-1 break-keep text-2xl font-semibold sm:text-3xl">
          {companyName}
        </h1>

        {/* 지원 상태 인라인 편집 */}
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectPrimitive.Trigger asChild>
            <Badge className={cn(statusBadgeClass(status), 'shrink-0 cursor-pointer select-none')}>
              <CircleDotIcon className="mr-1" />
              {status}
            </Badge>
          </SelectPrimitive.Trigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 상세 뱃지 */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-foreground/10 pt-4">
        <Badge variant="outline" className="gap-1">
          <BriefcaseIcon className="size-3" />
          {careerLevel}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <BuildingIcon className="size-3" />
          {companySize}
        </Badge>
        <DatePicker
          value={deadline ?? undefined}
          onChange={handleDeadlineChange}
          placeholder="채용 시 마감"
          className="w-auto h-auto border border-border rounded-full bg-transparent px-2.5 py-0.5 text-xs font-semibold shadow-none hover:bg-accent focus-visible:ring-0"
        />

        {/* 채용공고 URL 인라인 편집 */}
        {editingUrl ? (
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onBlur={handleUrlSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUrlSave()
              if (e.key === 'Escape') {
                setUrlInput(url)
                setEditingUrl(false)
              }
            }}
            placeholder="https://..."
            autoFocus
            className="h-6 w-48 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        ) : url ? (
          <div className="flex items-center gap-1">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Badge variant="destructive" className="gap-1">
                <ExternalLinkIcon className="size-3" />
                채용 공고
              </Badge>
            </a>
            <button
              onClick={() => { setUrlInput(url); setEditingUrl(true) }}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="URL 수정"
            >
              <PencilIcon className="size-3" />
            </button>
          </div>
        ) : (
          <Badge
            variant="outline"
            className="cursor-pointer gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => setEditingUrl(true)}
          >
            <PencilIcon className="size-3" />
            URL 추가
          </Badge>
        )}
      </div>
    </div>
  )
}
