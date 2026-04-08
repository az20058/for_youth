import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';
import { crawlCompanyInfo } from '@/lib/crawl';
import { summarizeCompany } from '@/lib/companySummary';

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ message: '인증이 필요합니다.' }, { status: 401 });

  const { id } = await params;

  const application = await prisma.application.findFirst({
    where: { id, userId },
    select: { companyName: true },
  });
  if (!application) return NextResponse.json({ message: '지원서를 찾을 수 없습니다.' }, { status: 404 });

  const existing = await prisma.companySummary.findUnique({ where: { applicationId: id } });
  if (existing && Date.now() - existing.crawledAt.getTime() < CACHE_DURATION_MS) {
    return NextResponse.json({
      overview: existing.overview,
      mainBusiness: JSON.parse(existing.mainBusiness) as string[],
      recentNews: JSON.parse(existing.recentNews) as string[],
      motivationHints: JSON.parse(existing.motivationHints) as string[],
      crawledAt: existing.crawledAt.toISOString(),
    });
  }

  const crawlResult = await crawlCompanyInfo(application.companyName);
  if (!crawlResult.namuWiki && crawlResult.newsHeadlines.length === 0) {
    return NextResponse.json({ message: '기업 정보를 찾을 수 없습니다.' }, { status: 500 });
  }

  const summary = await summarizeCompany(application.companyName, crawlResult);

  const saved = await prisma.companySummary.upsert({
    where: { applicationId: id },
    create: {
      applicationId: id,
      overview: summary.overview,
      mainBusiness: JSON.stringify(summary.mainBusiness),
      recentNews: JSON.stringify(summary.recentNews),
      motivationHints: JSON.stringify(summary.motivationHints),
    },
    update: {
      overview: summary.overview,
      mainBusiness: JSON.stringify(summary.mainBusiness),
      recentNews: JSON.stringify(summary.recentNews),
      motivationHints: JSON.stringify(summary.motivationHints),
      crawledAt: new Date(),
    },
  });

  return NextResponse.json({
    overview: saved.overview,
    mainBusiness: JSON.parse(saved.mainBusiness) as string[],
    recentNews: JSON.parse(saved.recentNews) as string[],
    motivationHints: JSON.parse(saved.motivationHints) as string[],
    crawledAt: saved.crawledAt.toISOString(),
  });
}
