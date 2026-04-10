import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';
import type { Recommendation, QuizAnswers } from '@/lib/quiz';

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });

  const body = await request.json() as { answers: QuizAnswers; recommendations: Recommendation[] };
  if (!body.answers || !body.recommendations) {
    return Response.json({ message: '잘못된 요청입니다.' }, { status: 400 });
  }

  await prisma.userQuizResult.create({
    data: {
      userId,
      answers: JSON.stringify(body.answers),
      recommendations: JSON.stringify(body.recommendations),
    },
  });

  return Response.json({ success: true }, { status: 201 });
}
