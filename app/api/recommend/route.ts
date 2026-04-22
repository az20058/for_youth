import { NextRequest, NextResponse } from 'next/server';
import type { QuizAnswers } from '@/lib/quiz';
import { fetchAllYouthPolicies } from '@/lib/youthApi';
import { scoreAndRankPrograms } from '@/lib/recommendUtils';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

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
