import { ALL_PROGRAMS } from './recommendUtils';
import type { Recommendation } from './quiz';

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

export const SIDO_MAP: Record<string, string> = {
  '11': '서울', '21': '부산', '22': '대구', '23': '인천', '24': '광주',
  '25': '대전', '26': '울산', '29': '세종', '31': '경기', '32': '강원',
  '33': '충북', '34': '충남', '35': '전북', '36': '전남', '37': '경북',
  '38': '경남', '39': '제주',
};

export function zipCdToRegions(zipCd: string): string {
  const codes = zipCd.split(',').map((c) => c.trim()).filter(Boolean);
  const regions = [...new Set(codes.map((c) => SIDO_MAP[c.slice(0, 2)] ?? '').filter(Boolean))];
  return regions.join(', ');
}

function isActive(p: YouthPolicy): boolean {
  if (!p.bizPrdEndYmd || p.bizPrdEndYmd === '' || p.bizPrdSeCd === '0056001') return true;
  return p.bizPrdEndYmd >= TODAY;
}

function mapPolicy(p: YouthPolicy): Recommendation {
  return {
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
    region: p.zipCd ? zipCdToRegions(p.zipCd) : '',
    zipCodes: p.zipCd || '',
  };
}

export async function fetchAllYouthPolicies(): Promise<Recommendation[]> {
  const serviceKey = process.env.YOUTH_API_SERVICE_KEY;
  if (!serviceKey) return ALL_PROGRAMS;

  try {
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

    const pageSize = 500;
    const totalPages = Math.ceil(totCount / pageSize);

    const pages = await Promise.all(
      Array.from({ length: totalPages }, (_, i) => i + 1).map(async (pageNum) => {
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

    return pages.flat().filter(isActive).map(mapPolicy);
  } catch {
    return ALL_PROGRAMS;
  }
}
