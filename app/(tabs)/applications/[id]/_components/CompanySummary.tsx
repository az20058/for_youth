'use client';

import { useEffect, useState } from 'react';
import { SparklesIcon, RefreshCwIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlameLoading } from '@/components/ui/flame-loading';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

interface CompanySummaryData {
  overview: string;
  mainBusiness: string[];
  recentNews: string[];
  motivationHints: string[];
  referenceSites: string[];
  idealCandidate: string[];
  crawledAt: string;
}

export function CompanySummary({ applicationId }: { applicationId: string }) {
  const [data, setData] = useState<CompanySummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cacheChecked, setCacheChecked] = useState(false);

  useEffect(() => {
    async function checkCache() {
      try {
        const res = await fetch(`/api/applications/${applicationId}/company-summary`);
        if (res.ok) {
          setData(await res.json() as CompanySummaryData);
        }
      } catch {
        // 캐시 조회 실패는 무시 — 버튼으로 분석 유도
      } finally {
        setCacheChecked(true);
      }
    }
    checkCache();
  }, [applicationId]);

  async function analyze() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/company-summary`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null) as { message?: string } | null;
        throw new Error(body?.message ?? '분석에 실패했습니다.');
      }
      setData(await res.json() as CompanySummaryData);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '분석에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (!cacheChecked) return null;

  // 캐시 없고 분석 전: 버튼 표시
  if (!data && !loading && !errorMessage) {
    return (
      <section className="rounded-2xl bg-card ring-1 ring-foreground/10 p-5 sm:p-6">
        <div className="flex items-center mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <SparklesIcon className="size-4 text-primary" />
            기업 분석
          </h2>
        </div>
        <Button onClick={analyze} variant="outline" className="w-full gap-2">
          <SparklesIcon className="size-4" />
          AI로 기업 분석하기
        </Button>
      </section>
    );
  }

  // 로딩 중
  if (loading) {
    return (
      <section className="rounded-2xl bg-card ring-1 ring-foreground/10 p-5 sm:p-6">
        <div className="flex items-center mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <SparklesIcon className="size-4 text-primary" />
            기업 분석
          </h2>
        </div>
        <FlameLoading message="기업 정보를 분석하는 중…" />
      </section>
    );
  }

  // 에러
  if (errorMessage && !data) {
    return (
      <section className="rounded-2xl bg-card ring-1 ring-foreground/10 p-5 sm:p-6">
        <div className="flex items-center mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <SparklesIcon className="size-4 text-primary" />
            기업 분석
          </h2>
        </div>
        <div className="flex flex-col items-center gap-3 py-4">
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <Button variant="outline" size="sm" onClick={analyze}>다시 시도</Button>
        </div>
      </section>
    );
  }

  // 데이터 있음: 아코디언
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="company-summary" className="rounded-2xl bg-card ring-1 ring-foreground/10 border-b-0">
        <AccordionTrigger className="px-5 sm:px-6 py-4 hover:no-underline">
          <div className="flex items-center gap-1.5">
            <SparklesIcon className="size-4 text-primary" />
            <span className="text-sm font-semibold">기업 분석</span>
            {data && (
              <span className="text-xs text-muted-foreground ml-2">
                {formatDistanceToNow(new Date(data.crawledAt), { addSuffix: true, locale: ko })}
              </span>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-5 sm:px-6">
          {data && (
            <>
              <div className="flex justify-end mb-3">
                <Button variant="ghost" size="icon" className="size-7" onClick={analyze} disabled={loading} aria-label="새로고침">
                  <RefreshCwIcon className="size-3.5" />
                </Button>
              </div>
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
                {data.recentNews.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">📰 최근 이슈</p>
                    <ul className="flex flex-col gap-1.5">
                      {data.recentNews.map((n, i) => (
                        <li key={i} className="text-sm text-foreground/80 before:content-['•'] before:mr-2 before:text-muted-foreground">{n}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">✏️ 지원 동기 포인트</p>
                  <ul className="flex flex-col gap-1.5">
                    {data.motivationHints.map((h, i) => (
                      <li key={i} className="text-sm text-foreground/80 before:content-['•'] before:mr-2 before:text-muted-foreground">{h}</li>
                    ))}
                  </ul>
                </div>
                {data.idealCandidate.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">🎯 인재상</p>
                    <ul className="flex flex-col gap-1.5">
                      {data.idealCandidate.map((c, i) => (
                        <li key={i} className="text-sm text-foreground/80 before:content-['•'] before:mr-2 before:text-muted-foreground">{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.referenceSites.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">🔗 참고 사이트</p>
                    <ul className="flex flex-col gap-1.5">
                      {data.referenceSites.map((s, i) => (
                        <li key={i} className="text-sm text-foreground/80 before:content-['•'] before:mr-2 before:text-muted-foreground">
                          <a href={s} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 break-all">{s}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
