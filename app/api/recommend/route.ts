import { NextRequest, NextResponse } from 'next/server';
import type { QuizAnswers } from '@/lib/quiz';
import { fetchAllYouthPolicies } from '@/lib/youthApi';
import { scoreAndRankPrograms } from '@/lib/recommendUtils';

export async function POST(req: NextRequest) {
  try {
    const { answers } = (await req.json()) as { answers: QuizAnswers };

    const all = await fetchAllYouthPolicies();
    const recommendations = scoreAndRankPrograms(all, answers);

    return NextResponse.json({ recommendations });
  } catch (err) {
    console.error('[recommend]', err);
    return NextResponse.json({ recommendations: [] }, { status: 500 });
  }
}
