'use client';

import { ExternalLinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Source, SourceType } from '@/lib/crawl';

export type { Source, SourceType };

function shortDomain(domain: string): string {
  // 'news.naver.com' → 'news.naver'  /  'data.go.kr' → 'data.go'
  const parts = domain.split('.');
  if (parts.length >= 2) {
    return parts.slice(0, -1).join('.');
  }
  return domain;
}

interface SourceChipProps {
  source: Source;
}

export function SourceChip({ source }: SourceChipProps) {
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${source.domain}&sz=32`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge
          variant="outline"
          className="h-5 px-1.5 text-[10px] gap-1 cursor-pointer select-none hover:bg-accent transition-colors"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={faviconUrl}
            alt=""
            className="size-3"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {shortDomain(source.domain)}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-3">
        <p className="text-sm font-medium leading-snug">{source.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{source.domain}</p>
        <div className="mt-2">
          {source.url ? (
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5 w-full">
                <ExternalLinkIcon className="size-3.5" />
                새 탭 열기
              </Button>
            </a>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5 w-full" disabled>
              <ExternalLinkIcon className="size-3.5" />
              새 탭 열기
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
