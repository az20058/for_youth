'use client';

import { useState, useRef, useEffect } from 'react';
import { ExternalLink, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Recommendation } from "@/lib/quiz";

interface ProgramCardProps {
  program: Recommendation;
  badgeClassName?: string;
}

export function ProgramCard({ program }: ProgramCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const [open, setOpen] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (el) setIsClamped(el.scrollHeight > el.clientHeight);
  }, []);

  const hasMatchReason = !!program.matchReason;
  const text = hasMatchReason ? program.matchReason : program.description;

  return (
    <>
      <Card className="cursor-pointer hover:ring-1 hover:ring-primary/40 active:ring-1 active:ring-primary/40 active:scale-[0.99] transition-all" onClick={() => setOpen(true)}>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-2">
              <CardTitle>{program.name}</CardTitle>
              <span className="text-xs text-muted-foreground">{program.agency}</span>
              <div className="flex flex-wrap gap-1.5">
                {program.mainCategory && (
                  <Badge variant="tag" className="text-xs">
                    #{program.mainCategory}
                  </Badge>
                )}
                <Badge variant="tag" className="text-xs">
                  #{program.category}
                </Badge>
              </div>
            </div>
            {program.applicationUrl && (
              <a
                href={program.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 flex items-center gap-1 text-xs text-primary hover:opacity-80 transition-opacity mt-0.5"
              >
                신청하기
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </CardHeader>
        {(program.description || program.matchReason) && (
          <CardContent className="flex flex-col gap-3">
            {hasMatchReason && program.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {program.description}
              </p>
            )}
            {text && (
              <div className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-2">
                <p
                  ref={textRef}
                  className={`text-xs text-white leading-relaxed flex items-start gap-1.5 ${expanded ? '' : 'line-clamp-3'}`}
                >
                  {hasMatchReason && <Lightbulb className="size-3.5 shrink-0 mt-0.5 text-primary" />}
                  {text}
                </p>
                {(isClamped || expanded) && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
                    className="mt-1 text-xs text-primary/70 hover:text-primary transition-colors"
                  >
                    {expanded ? '접기' : '더보기'}
                  </button>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex flex-col max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{program.name}</DialogTitle>
            <DialogDescription>{program.agency}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-1.5">
            {program.mainCategory && (
              <Badge variant="tag" className="text-xs">#{program.mainCategory}</Badge>
            )}
            <Badge variant="tag" className="text-xs">#{program.category}</Badge>
            {program.region &&
              program.region.split(', ').map((r) => (
                <Badge key={r} variant="tag" className="text-xs">#{r}</Badge>
              ))}
          </div>
          <div className="overflow-y-auto flex-1 min-h-0">
            {(program.supportContent || program.description) && (
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {program.supportContent || program.description}
              </p>
            )}
          </div>
          {program.applicationUrl && (
            <a
              href={program.applicationUrl}
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
    </>
  );
}
