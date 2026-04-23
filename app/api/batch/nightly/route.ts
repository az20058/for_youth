import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/db';
import { fetchFromYouthApi } from '@/lib/youthApi';
import { scoreAndFilterPrograms } from '@/lib/recommendUtils';
import { todayKstStart, kstDateKey } from '@/lib/dateKst';
import type { QuizAnswers, Recommendation } from '@/lib/quiz';

export const maxDuration = 300;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = req.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  if (authHeader.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const policies = await fetchFromYouthApi();
    if (policies.length === 0) {
      return NextResponse.json({ synced: 0, matched: 0 });
    }
    const incomingIds = policies.map((p) => p.id!);

    const existing = await prisma.youthPolicy.findMany({
      where: { plcyNo: { in: incomingIds } },
      select: { plcyNo: true },
    });
    const existingIdSet = new Set(existing.map((r) => r.plcyNo));
    const newIds = incomingIds.filter((id) => !existingIdSet.has(id));

    await prisma.youthPolicy.deleteMany({ where: { plcyNo: { notIn: incomingIds } } });
    await prisma.youthPolicy.createMany({
      data: policies.map((p) => ({
        plcyNo: p.id!,
        name: p.name,
        agency: p.agency,
        mainCategory: p.mainCategory,
        category: p.category,
        description: p.description,
        supportContent: p.supportContent ?? null,
        applicationUrl: p.applicationUrl ?? null,
        viewCount: p.viewCount ?? 0,
        region: p.region ?? null,
        zipCodes: p.zipCodes ?? null,
        bizPrdEndYmd: null,
      })),
      skipDuplicates: true,
    });
    await Promise.all(policies.map((p) =>
      prisma.youthPolicy.update({
        where: { plcyNo: p.id! },
        data: {
          name: p.name, agency: p.agency, mainCategory: p.mainCategory, category: p.category,
          description: p.description, supportContent: p.supportContent ?? null,
          applicationUrl: p.applicationUrl ?? null, region: p.region ?? null, zipCodes: p.zipCodes ?? null,
        },
      }).catch(() => null),
    ));
    revalidateTag('youth-policies', 'max');

    let matched = 0;
    if (newIds.length > 0) {
      const newPolicies = await prisma.youthPolicy.findMany({
        where: { plcyNo: { in: newIds } },
      });
      const usersWithQuiz = await prisma.$queryRaw<Array<{ userId: string; answers: string }>>`
        SELECT DISTINCT ON ("userId") "userId", "answers"
        FROM "UserQuizResult"
        ORDER BY "userId", "createdAt" DESC
      `;
      const today = kstDateKey(todayKstStart());
      const rows = usersWithQuiz.flatMap(({ userId, answers }) => {
        let parsed: QuizAnswers;
        try { parsed = JSON.parse(answers) as QuizAnswers; } catch { return []; }
        const hits = scoreAndFilterPrograms(newPolicies as unknown as Recommendation[], parsed, 2);
        if (hits.length === 0) return [];
        return [{
          userId,
          type: 'POLICY_MATCH' as const,
          title: `새 맞춤 정책 ${hits.length}건`,
          message: '회원님께 맞는 신규 정책이 등록되었어요. 눌러서 확인해보세요.',
          relatedId: null,
          dedupeKey: `policy-new:${userId}:${today}`,
        }];
      });
      if (rows.length > 0) {
        await prisma.notification.createMany({ data: rows, skipDuplicates: true });
        matched = rows.length;
      }
    }
    return NextResponse.json({ synced: incomingIds.length, matched });
  } catch (err) {
    console.error('[nightly]', err);
    return NextResponse.json({ error: 'nightly failed' }, { status: 500 });
  }
}
