'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Recommendation } from '@/lib/quiz';

interface HeroCarouselProps {
  programs: Recommendation[];
}

const INTERVAL_MS = 3500;

export function HeroCarousel({ programs }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % programs.length);
    }, INTERVAL_MS);
  }, [programs.length]);

  useEffect(() => {
    if (programs.length <= 1) return;
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [programs.length, startTimer]);

  if (programs.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#2D2D2D]">
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {programs.map((program, i) => (
          <div key={program.id ?? program.name + i} className="min-w-full p-5 flex flex-col gap-2">
            <span className="text-xs text-primary font-medium">{program.mainCategory}</span>
            <p className="text-white font-bold text-lg leading-snug">{program.name}</p>
            <p className="text-[#9B9B9B] text-xs">{program.agency}</p>
            {program.description && (
              <p className="text-[#9B9B9B] text-sm leading-relaxed mt-1 line-clamp-2">
                {program.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      {programs.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-3">
          {programs.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`슬라이드 ${i + 1}`}
              onClick={() => {
                setCurrent(i);
                startTimer();
              }}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-4 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
