'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Header } from '@/components/ui/header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Recommendation } from '@/lib/quiz';

const DEFAULT_HOT_PROGRAMS: Recommendation[] = [
  { name: '청년내일채움공제', agency: '고용노동부', mainCategory: '취업·창업', category: '취업지원', description: '', matchReason: '', viewCount: 58420, applicationUrl: 'https://www.work.go.kr' },
  { name: '청년도약계좌', agency: '금융위원회', mainCategory: '금융·자산형성', category: '금융지원', description: '', matchReason: '', viewCount: 41200, applicationUrl: 'https://www.kinfa.or.kr' },
  { name: '청년마음건강지원사업', agency: '보건복지부', mainCategory: '정신건강', category: '심리지원', description: '', matchReason: '', viewCount: 18900, applicationUrl: 'https://www.mohw.go.kr' },
  { name: '청년월세 특별지원', agency: '국토교통부', mainCategory: '주거', category: '주거지원', description: '', matchReason: '', viewCount: 35800, applicationUrl: 'https://www.myhome.go.kr' },
];

export default function Home() {
  const [recommendations] = useState<Recommendation[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('ember_recommendations');
      return stored ? (JSON.parse(stored) as Recommendation[]) : [];
    } catch {
      return [];
    }
  });

  const hasPersonalized = recommendations.length > 0;
  const featured = hasPersonalized ? recommendations[0] : null;
  const hotPrograms = (
    hasPersonalized
      ? [...recommendations].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      : DEFAULT_HOT_PROGRAMS
  ).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#1C1C1E]">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 py-6 flex flex-col gap-8">
        {/* 이번주 추천 섹션 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-white font-bold text-base">이번주 이런 도전은 어때요?</h2>
          {featured ? (
            <div className="rounded-2xl bg-[#2D2D2D] p-5 flex flex-col gap-2">
              <span className="text-xs text-[#FE6E6E] font-medium">{featured.mainCategory}</span>
              <p className="text-white font-bold text-lg leading-snug">{featured.name}</p>
              <p className="text-[#9B9B9B] text-xs">{featured.agency}</p>
              <p className="text-[#9B9B9B] text-sm leading-relaxed mt-1">{featured.description}</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-purple-700 via-purple-500 to-blue-400 aspect-video flex items-end p-5">
              <div className="flex flex-col gap-1">
                <p className="text-white/80 text-xs">여러분을 초대합니다</p>
                <p className="text-white font-bold text-2xl leading-tight">별무리 활동</p>
                <p className="text-white/70 text-xs">독서&amp;취미모임: ZOOM</p>
              </div>
            </div>
          )}
          <Link
            href="/quiz"
            className="flex items-center justify-between bg-[#FE6E6E] text-white rounded-xl px-5 py-4 text-sm font-medium hover:bg-[#FE6E6E]/90 transition-colors"
          >
            새로운 도전을 추천받기
            <ArrowRight className="size-5" />
          </Link>
        </section>

        {/* HOT 프로그램 섹션 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-white font-bold text-base">지금 HOT한 열정들</h2>
          <div className="flex flex-col gap-3">
            {hotPrograms.map((program) => (
              <Card key={program.name} className="bg-[#2D2D2D] border-0 ring-0">
                <CardContent className="py-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-white font-bold text-sm">{program.name}</p>
                    {program.applicationUrl && (
                      <a
                        href={program.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-0.5 text-xs text-[#FE6E6E] hover:opacity-80 transition-opacity"
                      >
                        바로가기
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-yellow-300 border-[#3A3A3A] text-xs">
                      #{program.mainCategory}
                    </Badge>
                    <Badge variant="outline" className="text-yellow-300 border-[#3A3A3A] text-xs">
                      #{program.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
