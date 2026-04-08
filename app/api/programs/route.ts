import { fetchAllYouthPolicies } from '@/lib/youthApi';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '20')));
  const category = searchParams.get('category') ?? '전체';

  const all = await fetchAllYouthPolicies();
  const filtered = category === '전체' ? all : all.filter((p) => p.mainCategory === category);
  const sorted = [...filtered].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));

  const total = sorted.length;
  const totalPages = Math.ceil(total / limit);
  const items = sorted.slice((page - 1) * limit, page * limit);

  const categories = ['전체', ...Array.from(new Set(all.map((p) => p.mainCategory ?? '기타')))];

  return Response.json({ items, total, totalPages, page, limit, categories });
}
