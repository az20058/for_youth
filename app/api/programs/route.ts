import { fetchAllYouthPolicies } from '@/lib/youthApi';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '20')));
  const category = searchParams.get('category') ?? '전체';

  const region = searchParams.get('region') ?? '전체';

  const all = await fetchAllYouthPolicies();
  const filtered = all.filter((p) => {
    const categoryMatch = category === '전체' || p.mainCategory === category;
    const validCodes = (p.zipCodes || '')
      .split(',')
      .map((c) => c.trim())
      .filter((c) => /^\d{5}$/.test(c));
    const regionMatch =
      region === '전체' ||
      validCodes.length === 0 ||
      validCodes.some((c) => c.startsWith(region));
    return categoryMatch && regionMatch;
  });
  const sorted = [...filtered].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));

  const total = sorted.length;
  const totalPages = Math.ceil(total / limit);
  const items = sorted.slice((page - 1) * limit, page * limit);

  const categories = ['전체', ...Array.from(new Set(all.map((p) => p.mainCategory ?? '기타')))];

  return Response.json({ items, total, totalPages, page, limit, categories });
}
