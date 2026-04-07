'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { fetchApplications } from '@/lib/api';
import { FlameLoading } from '@/components/ui/flame-loading';
import type { CoverLetterType, CoverLetterWithApplication } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const ALL_TYPES: (CoverLetterType | '전체')[] = [
  '전체',
  '지원 동기',
  '성장 과정',
  '직무 역량',
  '성격 장단점',
  '성공 경험',
  '실패 경험',
  '팀워크 경험',
  '입사 후 포부',
  '기타',
];

export function CoverLettersList() {
  const [activeType, setActiveType] = useState<CoverLetterType | '전체'>('전체');

  const { data: applications = [], isLoading, isError } = useQuery({
    queryKey: ['applications'],
    queryFn: fetchApplications,
  });

  const coverLetters = useMemo<CoverLetterWithApplication[]>(() => {
    return applications.flatMap((app) =>
      app.coverLetters.map((cl) => ({
        coverLetterId: cl.id,
        question: cl.question,
        answer: cl.answer,
        type: cl.type ?? null,
        applicationId: app.id,
        companyName: app.companyName,
      })),
    );
  }, [applications]);

  const filtered = useMemo(() => {
    if (activeType === '전체') return coverLetters;
    return coverLetters.filter((cl) => (cl.type ?? '기타') === activeType);
  }, [coverLetters, activeType]);

  if (isLoading) {
    return <FlameLoading />;
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">데이터를 불러오지 못했습니다.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {ALL_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveType(type)}
            className={cn(
              'px-3 py-1 rounded-full text-sm font-medium transition-colors',
              activeType === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {type}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-muted-foreground">총 {filtered.length}개</p>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">자기소개서가 없습니다.</p>
      ) : (
        <Accordion type="multiple" className="flex flex-col gap-2">
          {filtered.map((cl) => (
            <AccordionItem
              key={cl.coverLetterId}
              value={cl.coverLetterId}
              className="border rounded-xl px-1 overflow-hidden"
            >
              <AccordionTrigger className="px-3 hover:no-underline gap-3">
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  {cl.type && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                      {cl.type}
                    </span>
                  )}
                  <Link
                    href={`/applications/${cl.applicationId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    {cl.companyName}
                  </Link>
                  <span className="flex-1 truncate text-sm text-left font-medium">
                    {cl.question || '제목 없음'}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4">
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {cl.answer || '내용 없음'}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
