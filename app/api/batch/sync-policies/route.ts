import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/db';
import { fetchFromYouthApi } from '@/lib/youthApi';

export const maxDuration = 300; // Vercel Pro: 5분 / Hobby: 60초

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const policies = await fetchFromYouthApi();

    if (policies.length === 0) {
      return NextResponse.json({ message: 'No policies fetched', synced: 0 });
    }

    const incomingIds = policies.map((p) => p.id!);

    // 1. API 응답에 없는 정책(만료/제거)만 삭제 — 싱크 중 데이터 공백 없음
    await prisma.youthPolicy.deleteMany({
      where: { plcyNo: { notIn: incomingIds } },
    });

    // 2. 신규 정책 삽입 (이미 존재하는 ID는 건너뜀)
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

    // 3. 기존 정책 필드 갱신 (viewCount는 사용자 조회수이므로 덮어쓰지 않음)
    await Promise.all(
      policies.map((p) =>
        prisma.youthPolicy
          .update({
            where: { plcyNo: p.id! },
            data: {
              name: p.name,
              agency: p.agency,
              mainCategory: p.mainCategory,
              category: p.category,
              description: p.description,
              supportContent: p.supportContent ?? null,
              applicationUrl: p.applicationUrl ?? null,
              region: p.region ?? null,
              zipCodes: p.zipCodes ?? null,
            },
          })
          .catch(() => null),
      ),
    );

    revalidateTag('youth-policies', 'max');
    return NextResponse.json({ message: 'Sync complete', synced: policies.length });
  } catch (err) {
    console.error('[sync-policies]', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
