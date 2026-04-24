import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';
import { crawlCompanyInfo } from '@/lib/crawl';
import { summarizeCompany } from '@/lib/companySummary';

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

function normalizeCompanyName(name: string): string {
  return name
    .trim()
    .replace(/^주식회사\s*|\s*주식회사$/g, '')
    .replace(/^\(주\)\s*|\s*\(주\)$/g, '')
    .replace(/,?\s*(Inc\.?|Corp\.?|Ltd\.?|LLC|Co\.?,?\s*Ltd\.?)$/i, '')
    .trim();
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });

  const { id } = await params;

  const application = await prisma.application.findFirst({
    where: { id, userId, deletedAt: null },
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
      referenceSites: JSON.parse(existing.referenceSites) as string[],
      idealCandidate: JSON.parse(existing.idealCandidate) as string[],
      crawledAt: existing.crawledAt.toISOString(),
    });
  }

  try {
    const crawlResult = await crawlCompanyInfo(companyName);
    if (!crawlResult.corpInfo && !crawlResult.webSnippets && crawlResult.newsHeadlines.length === 0) {
      return Response.json({ message: `"${companyName}"에 대한 크롤링 데이터를 찾을 수 없습니다.` }, { status: 422 });
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
        referenceSites: JSON.stringify(summary.referenceSites),
        idealCandidate: JSON.stringify(summary.idealCandidate),
      },
      update: {
        overview: summary.overview,
        mainBusiness: JSON.stringify(summary.mainBusiness),
        recentNews: JSON.stringify(summary.recentNews),
        motivationHints: JSON.stringify(summary.motivationHints),
        referenceSites: JSON.stringify(summary.referenceSites),
        idealCandidate: JSON.stringify(summary.idealCandidate),
        crawledAt: new Date(),
      },
    });

    return Response.json({
      overview: summary.overview,
      mainBusiness: summary.mainBusiness,
      recentNews: summary.recentNews,
      motivationHints: summary.motivationHints,
      referenceSites: summary.referenceSites,
      idealCandidate: summary.idealCandidate,
      crawledAt: saved.crawledAt.toISOString(),
    });
  } catch (err) {
    console.error('[company-summary]', err);
    return Response.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
