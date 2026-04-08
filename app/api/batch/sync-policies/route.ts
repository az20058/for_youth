import { NextRequest, NextResponse } from 'next/server';
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

    await prisma.$transaction([
      prisma.youthPolicy.deleteMany(),
      prisma.youthPolicy.createMany({
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
        })),
        skipDuplicates: true,
      }),
    ]);

    return NextResponse.json({ message: 'Sync complete', synced: policies.length });
  } catch (err) {
    console.error('[sync-policies]', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
