import { ALL_PROGRAMS } from '@/lib/recommendUtils';
import type { Recommendation } from '@/lib/quiz';

interface YouthPolicy {
  plcyNo?: string;
  plcyNm?: string;
  sprvsnInstCdNm?: string;
  lclsfNm?: string;
  mclsfNm?: string;
  plcySprtCn?: string;
  plcyExplnCn?: string;
  aplyUrlAddr?: string;
  refUrlAddr1?: string;
  inqCnt?: string;
  bizPrdEndYmd?: string;
  bizPrdSeCd?: string;
  zipCd?: string;
}

const TODAY = new Date().toISOString().slice(0, 10).replace(/-/g, '');

function isActive(p: YouthPolicy): boolean {
  // 상시(0056001) 또는 종료일 없음
  if (!p.bizPrdEndYmd || p.bizPrdEndYmd === '' || p.bizPrdSeCd === '0056001') return true;
  return p.bizPrdEndYmd >= TODAY;
}

async function fetchAllFromYouthCenter(): Promise<Recommendation[]> {
  const serviceKey = process.env.YOUTH_API_SERVICE_KEY;
  if (!serviceKey) return ALL_PROGRAMS;

  try {
    // 전체 개수 먼저 확인
    const firstParams = new URLSearchParams({
      apiKeyNm: serviceKey,
      pageNum: '1',
      pageSize: '1',
      rtnType: 'json',
    });
    const firstRes = await fetch(
      `https://www.youthcenter.go.kr/go/ythip/getPlcy?${firstParams}`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) },
    );
    if (!firstRes.ok) return ALL_PROGRAMS;

    const firstData = await firstRes.json();
    const totCount: number = firstData?.result?.pagging?.totCount ?? 0;
    if (totCount === 0) return ALL_PROGRAMS;

    // 500개씩 병렬 fetch
    const pageSize = 500;
    const totalPages = Math.ceil(totCount / pageSize);
    const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages = await Promise.all(
      pageNums.map(async (pageNum) => {
        const params = new URLSearchParams({
          apiKeyNm: serviceKey,
          pageNum: String(pageNum),
          pageSize: String(pageSize),
          rtnType: 'json',
        });
        const res = await fetch(
          `https://www.youthcenter.go.kr/go/ythip/getPlcy?${params}`,
          { headers: { Accept: 'application/json' }, next: { revalidate: 3600 }, signal: AbortSignal.timeout(15000) },
        );
        if (!res.ok) return [] as YouthPolicy[];
        const data = await res.json();
        return (data?.result?.youthPolicyList ?? []) as YouthPolicy[];
      }),
    );

    const all: YouthPolicy[] = pages.flat();
    const active = all.filter(isActive);

    return active.map((p) => ({
      id: p.plcyNo ?? '',
      name: p.plcyNm ?? '',
      agency: p.sprvsnInstCdNm ?? '',
      mainCategory: p.lclsfNm
        ? p.lclsfNm.split(',')[0].trim().replace(/･/g, '·')
        : '기타',
      category: p.mclsfNm ?? '',
      description: p.plcyExplnCn || p.plcySprtCn || '',
      matchReason: '',
      supportContent: p.plcySprtCn || '',
      applicationUrl: p.aplyUrlAddr || p.refUrlAddr1 || '',
      viewCount: p.inqCnt ? Number(p.inqCnt) : 0,
      region: p.zipCd || '',
    }));
  } catch {
    return ALL_PROGRAMS;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '20')));
  const category = searchParams.get('category') ?? '전체';

  const all = await fetchAllFromYouthCenter();
  const filtered = category === '전체' ? all : all.filter((p) => p.mainCategory === category);
  const sorted = [...filtered].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));

  const total = sorted.length;
  const totalPages = Math.ceil(total / limit);
  const items = sorted.slice((page - 1) * limit, page * limit);

  const categories = ['전체', ...Array.from(new Set(all.map((p) => p.mainCategory ?? '기타')))];

  return Response.json({ items, total, totalPages, page, limit, categories });
}
