import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';
import { crawlCompanyInfo } from '@/lib/crawl';
import { summarizeCompany } from '@/lib/companySummary';

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

function normalizeCompanyName(name: string): string {
  return name.trim();
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });

  const { id } = await params;

  const application = await prisma.application.findFirst({
    where: { id, userId },
    select: { companyName: true },
  });
  if (!application) return Response.json({ message: '지원서를 찾을 수 없습니다.' }, { status: 404 });

  const companyName = normalizeCompanyName(application.companyName);

  const existing = await prisma.companySummary.findUnique({ where: { companyName } });
  if (existing && Date.now() - existing.crawledAt.getTime() < CACHE_DURATION_MS) {
    return Response.json({
      overview: existing.overview,
      mainBusiness: JSON.parse(existing.mainBusiness) as string[],
      recentNews: JSON.parse(existing.recentNews) as string[],
      motivationHints: JSON.parse(existing.motivationHints) as string[],
      crawledAt: existing.crawledAt.toISOString(),
    });
  }

  try {
    const crawlResult = await crawlCompanyInfo(companyName);
    if (!crawlResult.namuWiki && crawlResult.newsHeadlines.length === 0) {
      return Response.json({ message: '기업 정보를 찾을 수 없습니다.' }, { status: 422 });
    }

    const summary = await summarizeCompany(companyName, crawlResult);

    const saved = await prisma.companySummary.upsert({
      where: { companyName },
      create: {
        companyName,
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

    return Response.json({
      overview: summary.overview,
      mainBusiness: summary.mainBusiness,
      recentNews: summary.recentNews,
      motivationHints: summary.motivationHints,
      crawledAt: saved.crawledAt.toISOString(),
    });
  } catch (err) {
    console.error('[company-summary]', err);
    return Response.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
