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

  if (typeof body.answers !== 'object' || !Array.isArray(body.recommendations)) {
    return Response.json({ message: '잘못된 데이터 형식입니다.' }, { status: 400 });
  }

  if (body.recommendations.length > 200) {
    return Response.json({ message: '추천 목록이 너무 많습니다.' }, { status: 400 });
  }

  const answersStr = JSON.stringify(body.answers);
  const recommendationsStr = JSON.stringify(body.recommendations);
  if (answersStr.length > 10_000 || recommendationsStr.length > 100_000) {
    return Response.json({ message: '데이터 크기가 너무 큽니다.' }, { status: 400 });
  }

  await prisma.userQuizResult.create({
    data: {
      userId,
      answers: answersStr,
      recommendations: recommendationsStr,
    },
  });

  return Response.json({ success: true }, { status: 201 });
}
