import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { QuizAnswers, Recommendation } from '@/lib/quiz';
import { buildPrompt, getSamplePrograms, getMockRecommendations, enrichWithViewCount } from '@/lib/recommendUtils';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 온통청년 API 호출 (공공데이터포털 서비스키 필요)
// https://www.youthcenter.go.kr 에서 API 신청
async function fetchYouthPrograms(region?: string): Promise<string> {
  const serviceKey = process.env.YOUTH_API_SERVICE_KEY;

  if (!serviceKey) {
    // API 키 없을 때 샘플 데이터 반환 (개발/테스트용)
    return getSamplePrograms();
  }

  try {
    const params = new URLSearchParams({
      serviceKey,
      pageIndex: '1',
      pageSize: '30',
      srchPolyBizSecd: region ?? '',
    });

    const res = await fetch(
      `https://www.youthcenter.go.kr/openApi/youthPlcyList.do?${params}`,
      { next: { revalidate: 3600 } }, // 1시간 캐시
    );

    if (!res.ok) return getSamplePrograms();

    const data = await res.json();
    const policies = data?.result?.youthPolicy ?? [];

    if (policies.length === 0) return getSamplePrograms();

    return policies
      .map((p: Record<string, string>) =>
        `- ${p.polyBizSjnm ?? ''} (${p.polyBizTy ?? ''}) | ${p.cnsgNmor ?? ''} | ${p.bizPrdCn ?? ''} | ${p.polyRlmCd ?? ''}`,
      )
      .join('\n');
  } catch {
    return getSamplePrograms();
  }
}


export async function POST(req: NextRequest) {
  try {
    const { answers } = (await req.json()) as { answers: QuizAnswers };

    const region = answers.region as string | undefined;
    const programs = await fetchYouthPrograms(region);
    const prompt = buildPrompt(answers, programs);

    const message = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.choices[0]?.message?.content ?? '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const raw: Recommendation[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    const recommendations = enrichWithViewCount(raw);

    return NextResponse.json({ recommendations });
  } catch (err) {
    console.error('[recommend]', err);
    // OpenAI 할당량 초과 또는 키 미설정 시 mock 데이터 반환 (개발용)
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ recommendations: getMockRecommendations() });
    }
    return NextResponse.json({ recommendations: [] }, { status: 500 });
  }
}
