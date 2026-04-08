'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { ProgramCard } from '@/components/ui/program-card';
import { FlameLoading } from '@/components/ui/flame-loading';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SIDO_REGIONS } from '@/lib/quiz';
import type { Recommendation } from '@/lib/quiz';

interface ProgramsResponse {
  items: Recommendation[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  categories: string[];
}

const LIMIT = 20;

async function fetchPrograms(page: number, category: string, region: string): Promise<ProgramsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(LIMIT),
    category,
    region,
  });
  const res = await fetch(`/api/programs?${params}`);
  if (!res.ok) throw new Error('정책 목록을 불러오지 못했습니다.');
  return res.json();
}

export function ProgramsList() {
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState('전체');
  const [activeRegion, setActiveRegion] = useState('전체');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['programs', page, activeCategory, activeRegion],
    queryFn: () => fetchPrograms(page, activeCategory, activeRegion),
    placeholderData: (prev) => prev,
  });

  function handleCategoryChange(category: string) {
    setActiveCategory(category);
    setPage(1);
  }

  function handleRegionChange(region: string) {
    setActiveRegion(region);
    setPage(1);
  }

  if (isLoading && !data) return <FlameLoading />;

  const categories = data?.categories ?? ['전체'];
  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryChange(category)}
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                activeCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {category}
            </button>
          ))}
        </div>

        <Select value={activeRegion} onValueChange={handleRegionChange}>
          <SelectTrigger className="w-28 shrink-0 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="전체">전체 지역</SelectItem>
            {SIDO_REGIONS.map((r) => (
              <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">총 {total}개</p>

      {isFetching ? (
        <FlameLoading />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((program) => (
            <ProgramCard key={program.id ?? program.name} program={program} badgeClassName="text-yellow-300 border-[#3A3A3A]" />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
