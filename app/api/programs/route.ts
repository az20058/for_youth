import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function GET(req: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '20')));
  const category = searchParams.get('category') ?? '전체';
  const region = searchParams.get('region') ?? '전체';

  // DB 레벨 필터링
  const where: Record<string, unknown> = {};
  if (category !== '전체') {
    where.mainCategory = category;
  }
  if (region !== '전체') {
    where.zipCodes = { contains: region };
  }

  const [items, total, allCategories] = await Promise.all([
    prisma.youthPolicy.findMany({
      where,
      orderBy: { viewCount: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.youthPolicy.count({ where }),
    prisma.youthPolicy.findMany({
      select: { mainCategory: true },
      distinct: ['mainCategory'],
    }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const categories = ['전체', ...allCategories.map((c) => c.mainCategory)];

  const mapped = items.map((p) => ({
    id: p.plcyNo,
    name: p.name,
    agency: p.agency,
    mainCategory: p.mainCategory,
    category: p.category,
    description: p.description,
    matchReason: '',
    supportContent: p.supportContent ?? '',
    applicationUrl: p.applicationUrl ?? '',
    viewCount: p.viewCount,
    region: p.region ?? '',
    zipCodes: p.zipCodes ?? '',
  }));

  return Response.json(
    { items: mapped, total, totalPages, page, limit, categories },
    { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' } },
  );
}
