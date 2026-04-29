import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';
import { crawlCompanyInfo } from '@/lib/crawl';
import { summarizeCompany } from '@/lib/companySummary';
import type { Source } from '@/lib/crawl';
import type { CitedItem } from '@/lib/companySummary';

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

function normalizeCompanyName(name: string): string {
  return name
    .trim()
    .replace(/^주식회사\s*|\s*주식회사$/g, '')
    .replace(/^\(주\)\s*|\s*\(주\)$/g, '')
    .replace(/,?\s*(Inc\.?|Corp\.?|Ltd\.?|LLC|Co\.?,?\s*Ltd\.?)$/i, '')
    .trim();
}

function parseV1Response(existing: {
  overview: string;
  mainBusiness: string;
  recentNews: string;
  motivationHints: string;
  referenceSites: string;
  idealCandidate: string;
  crawledAt: Date;
  schemaVersion: number;
}) {
  return {
    overview: existing.overview,
    mainBusiness: JSON.parse(existing.mainBusiness) as string[],
    recentNews: JSON.parse(existing.recentNews) as string[],
    motivationHints: JSON.parse(existing.motivationHints) as string[],
    referenceSites: JSON.parse(existing.referenceSites) as string[],
    idealCandidate: JSON.parse(existing.idealCandidate) as string[],
    sources: [] as Source[],
    schemaVersion: 1 as const,
    crawledAt: existing.crawledAt.toISOString(),
  };
}

function parseV2Response(existing: {
  overview: string;
  mainBusiness: string;
  recentNews: string;
  motivationHints: string;
  referenceSites: string;
  idealCandidate: string;
  sources: string;
  crawledAt: Date;
  schemaVersion: number;
}) {
  return {
    overview: JSON.parse(existing.overview) as CitedItem,
    mainBusiness: JSON.parse(existing.mainBusiness) as CitedItem[],
    recentNews: JSON.parse(existing.recentNews) as CitedItem[],
    motivationHints: JSON.parse(existing.motivationHints) as CitedItem[],
    referenceSites: JSON.parse(existing.referenceSites) as string[],
    idealCandidate: JSON.parse(existing.idealCandidate) as CitedItem[],
    sources: JSON.parse(existing.sources) as Source[],
    schemaVersion: 2 as const,
    crawledAt: existing.crawledAt.toISOString(),
  };
}

export async function GET(
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
  if (!existing) return Response.json({ message: '캐시 없음' }, { status: 404 });

  if (existing.schemaVersion >= 2) {
    try {
      return Response.json(parseV2Response(existing));
    } catch (err) {
      console.error('[company-summary] v2 parse failed, falling back to v1', err);
      return Response.json(parseV1Response(existing));
    }
  }
  return Response.json(parseV1Response(existing));
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

  // 24h 캐시: v2 캐시가 유효하면 그대로 반환
  const existing = await prisma.companySummary.findUnique({ where: { companyName } });
  if (
    existing &&
    existing.schemaVersion >= 2 &&
    Date.now() - existing.crawledAt.getTime() < CACHE_DURATION_MS
  ) {
    try {
      return Response.json(parseV2Response(existing));
    } catch (err) {
      console.error('[company-summary] v2 cache parse failed, re-analyzing', err);
      // fall through to re-analyze
    }
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
        overview: JSON.stringify(summary.overview),
        mainBusiness: JSON.stringify(summary.mainBusiness),
        recentNews: JSON.stringify(summary.recentNews),
        motivationHints: JSON.stringify(summary.motivationHints),
        referenceSites: '[]',
        idealCandidate: JSON.stringify(summary.idealCandidate),
        sources: JSON.stringify(summary.sources),
        schemaVersion: 2,
      },
      update: {
        overview: JSON.stringify(summary.overview),
        mainBusiness: JSON.stringify(summary.mainBusiness),
        recentNews: JSON.stringify(summary.recentNews),
        motivationHints: JSON.stringify(summary.motivationHints),
        idealCandidate: JSON.stringify(summary.idealCandidate),
        sources: JSON.stringify(summary.sources),
        schemaVersion: 2,
        crawledAt: new Date(),
      },
    });

    return Response.json({
      overview: summary.overview,
      mainBusiness: summary.mainBusiness,
      recentNews: summary.recentNews,
      motivationHints: summary.motivationHints,
      referenceSites: [] as string[],
      idealCandidate: summary.idealCandidate,
      sources: summary.sources,
      schemaVersion: 2 as const,
      crawledAt: saved.crawledAt.toISOString(),
    });
  } catch (err) {
    console.error('[company-summary]', err);
    return Response.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
