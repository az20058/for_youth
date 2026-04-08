'use client';

import { useState } from 'react';
import { SparklesIcon, RefreshCwIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlameLoading } from '@/components/ui/flame-loading';

interface CompanySummaryData {
  overview: string;
  mainBusiness: string[];
  recentNews: string[];
  motivationHints: string[];
  crawledAt: string;
}

export function CompanySummary({ applicationId }: { applicationId: string }) {
  const [data, setData] = useState<CompanySummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function analyze() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/applications/${applicationId}/company-summary`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error();
      setData(await res.json() as CompanySummaryData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl bg-card ring-1 ring-foreground/10 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold flex items-center gap-1.5">
          <SparklesIcon className="size-4 text-primary" />
          기업 분석
        </h2>
        {data && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(data.crawledAt), { addSuffix: true, locale: ko })}
            </span>
            <Button variant="ghost" size="icon" className="size-7" onClick={analyze} disabled={loading} aria-label="새로고침">
              <RefreshCwIcon className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {!data && !loading && !error && (
        <Button onClick={analyze} variant="outline" className="w-full gap-2">
          <SparklesIcon className="size-4" />
          AI로 기업 분석하기
        </Button>
      )}

      {loading && <FlameLoading message="기업 정보를 분석하는 중…" />}

      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-4">
          <p className="text-sm text-muted-foreground">분석에 실패했습니다. 다시 시도해주세요.</p>
          <Button variant="outline" size="sm" onClick={analyze}>다시 시도</Button>
        </div>
      )}

      {data && !loading && (
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">📋 기업 개요</p>
            <p className="text-sm leading-relaxed">{data.overview}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">🏢 핵심 사업</p>
            <div className="flex flex-wrap gap-1.5">
              {data.mainBusiness.map((b, i) => (
                <Badge key={i} variant="secondary">{b}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">📰 최근 이슈</p>
            <ul className="flex flex-col gap-1.5">
              {data.recentNews.map((n, i) => (
                <li key={i} className="text-sm text-foreground/80 before:content-['•'] before:mr-2 before:text-muted-foreground">{n}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">✏️ 지원 동기 포인트</p>
            <ul className="flex flex-col gap-1.5">
              {data.motivationHints.map((h, i) => (
                <li key={i} className="text-sm text-foreground/80 before:content-['•'] before:mr-2 before:text-muted-foreground">{h}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
