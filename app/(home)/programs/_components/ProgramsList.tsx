'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ProgramCard } from '@/components/ui/program-card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExternalLink } from 'lucide-react';
import { SIDO_REGIONS } from '@/lib/quiz';
import type { Recommendation } from '@/lib/quiz';

const LIMIT = 20;

interface Props {
  initialPolicies: Recommendation[];
  initialCategories: string[];
}

export function ProgramsList({ initialPolicies, initialCategories }: Props) {
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState('전체');
  const [activeRegion, setActiveRegion] = useState('전체');
  const searchParams = useSearchParams();
  const openId = searchParams.get('open');
  const openPolicy = openId ? initialPolicies.find(p => p.id === openId) ?? null : null;

  const availableRegions = useMemo(() => {
    const categoryFiltered =
      activeCategory === '전체'
        ? initialPolicies
        : initialPolicies.filter((p) => p.mainCategory === activeCategory);

    const hasNationwide = categoryFiltered.some((p) => {
      const codes = (p.zipCodes || '').split(',').map((c) => c.trim()).filter((c) => /^\d{5}$/.test(c));
      return codes.length === 0;
    });
    if (hasNationwide) return SIDO_REGIONS;

    const sidoCodes = new Set<string>();
    categoryFiltered.forEach((p) => {
      (p.zipCodes || '').split(',').forEach((raw) => {
        const c = raw.trim();
        if (/^\d{5}$/.test(c)) sidoCodes.add(c.slice(0, 2));
      });
    });
    return SIDO_REGIONS.filter((r) => sidoCodes.has(r.code));
  }, [initialPolicies, activeCategory]);

  const effectiveRegion =
    activeRegion === '전체' || availableRegions.some((r) => r.code === activeRegion)
      ? activeRegion
      : '전체';

  const filtered = useMemo(() => {
    const result = initialPolicies.filter((p) => {
      const categoryMatch = activeCategory === '전체' || p.mainCategory === activeCategory;
      const validCodes = (p.zipCodes || '')
        .split(',')
        .map((c) => c.trim())
        .filter((c) => /^\d{5}$/.test(c));
      const regionMatch =
        effectiveRegion === '전체' ||
        validCodes.length === 0 ||
        validCodes.some((c) => c.startsWith(effectiveRegion));
      return categoryMatch && regionMatch;
    });
    return result.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
  }, [initialPolicies, activeCategory, effectiveRegion]);

  const total = filtered.length;
  const totalPages = Math.ceil(total / LIMIT);
  const items = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  function handleCategoryChange(category: string) {
    setActiveCategory(category);
    setPage(1);
  }

  function handleRegionChange(region: string) {
    setActiveRegion(region);
    setPage(1);
  }

  return (
    <div>
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex flex-wrap gap-2">
          {initialCategories.map((category) => (
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

        <div className="flex justify-end">
          <Select value={effectiveRegion} onValueChange={handleRegionChange}>
            <SelectTrigger className="w-28 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="전체">전체 지역</SelectItem>
              {availableRegions.map((r) => (
                <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">총 {total}개</p>

      <div className="flex flex-col gap-3">
        {items.map((program) => (
          <ProgramCard key={program.id ?? program.name} program={program} />
        ))}
      </div>

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

      {openPolicy && (
        <Dialog defaultOpen>
          <DialogContent className="flex flex-col max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{openPolicy.name}</DialogTitle>
              <DialogDescription>{openPolicy.agency}</DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 min-h-0">
              {(openPolicy.supportContent || openPolicy.description) && (
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {openPolicy.supportContent || openPolicy.description}
                </p>
              )}
            </div>
            {openPolicy.applicationUrl && (
              <a
                href={openPolicy.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:opacity-80 transition-opacity"
              >
                신청하기
                <ExternalLink className="size-4" />
              </a>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
