'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Recommendation } from '@/lib/quiz';

interface HeroCarouselProps {
  programs: Recommendation[];
}

const INTERVAL_MS = 3500;
const SWIPE_THRESHOLD = 50;

export function HeroCarousel({ programs }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragStartX = useRef<number | null>(null);

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

  const goTo = useCallback((index: number) => {
    const clamped = (index + programs.length) % programs.length;
    setCurrent(clamped);
    startTimer();
  }, [programs.length, startTimer]);

  const handleDragStart = useCallback((clientX: number) => {
    dragStartX.current = clientX;
    setIsDragging(true);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const handleDragMove = useCallback((clientX: number) => {
    if (dragStartX.current === null) return;
    setDragOffset(clientX - dragStartX.current);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragStartX.current === null) return;
    if (dragOffset < -SWIPE_THRESHOLD) goTo(current + 1);
    else if (dragOffset > SWIPE_THRESHOLD) goTo(current - 1);
    else startTimer();
    dragStartX.current = null;
    setDragOffset(0);
    setIsDragging(false);
  }, [dragOffset, current, goTo, startTimer]);

  if (programs.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-[#2D2D2D] select-none cursor-grab active:cursor-grabbing"
      onMouseDown={(e) => handleDragStart(e.clientX)}
      onMouseMove={(e) => { if (isDragging) handleDragMove(e.clientX); }}
      onMouseUp={handleDragEnd}
      onMouseLeave={() => { if (isDragging) handleDragEnd(); }}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
      onTouchEnd={handleDragEnd}
    >
      {/* Slides */}
      <div
        className={`flex ${isDragging ? '' : 'transition-transform duration-500 ease-in-out'}`}
        style={{ transform: `translateX(calc(-${current * 100}% + ${dragOffset}px))` }}
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
              onClick={() => goTo(i)}
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
