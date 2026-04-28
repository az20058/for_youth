import type { Recommendation } from './quiz';
import { prisma } from './db';
import { normalizeUrl } from './utils';

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
  '11': '서울', '26': '부산', '27': '대구', '28': '인천', '29': '광주',
  '30': '대전', '31': '울산', '36': '세종', '41': '경기',
  '42': '강원', '51': '강원',   // 강원도(구) / 강원특별자치도(신)
  '43': '충북', '44': '충남',
  '45': '전북', '52': '전북',   // 전라북도(구) / 전북특별자치도(신)
  '46': '전남', '47': '경북', '48': '경남', '50': '제주',
};

export { normalizeUrl } from './utils';

export function zipCdToRegions(zipCd: string): string {
  const codes = zipCd.split(',').map((c) => c.trim()).filter((c) => /^\d{5}$/.test(c));
  const regions = [...new Set(codes.map((c) => SIDO_MAP[c.slice(0, 2)] ?? '').filter(Boolean))];
  return regions.join(', ');
}

function isActive(p: YouthPolicy): boolean {
  if (!p.bizPrdEndYmd || p.bizPrdEndYmd === '' || p.bizPrdSeCd === '0056001') return true;
  return p.bizPrdEndYmd >= TODAY;
}

function mapApiPolicy(p: YouthPolicy): Recommendation {
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
    applicationUrl: normalizeUrl(p.aplyUrlAddr || p.refUrlAddr1 || ''),
    viewCount: p.inqCnt ? Number(p.inqCnt) : 0,
    region: p.zipCd ? zipCdToRegions(p.zipCd) : '',
    zipCodes: p.zipCd || '',
  };
}

function mapDbPolicy(p: {
  plcyNo: string; name: string; agency: string; mainCategory: string;
  category: string; description: string; supportContent: string | null;
  applicationUrl: string | null; viewCount: number; region: string | null;
  zipCodes: string | null;
}): Recommendation {
  return {
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
  };
}

/** 온통청년 API에서 직접 전체 정책을 가져옵니다. (배치 Job용) */
export async function fetchFromYouthApi(): Promise<Recommendation[]> {
  const serviceKey = process.env.YOUTH_API_SERVICE_KEY;
  if (!serviceKey) return [];

  try {
    const firstParams = new URLSearchParams({
      apiKeyNm: serviceKey,
      pageNum: '1',
      pageSize: '1',
      rtnType: 'json',
    });
    const firstRes = await fetch(
      `https://www.youthcenter.go.kr/go/ythip/getPlcy?${firstParams}`,
      { headers: { Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(8000) },
    );
    if (!firstRes.ok) return [];

    const firstData = await firstRes.json();
    const totCount: number = firstData?.result?.pagging?.totCount ?? 0;
    if (totCount === 0) return [];

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
          { headers: { Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(15000) },
        );
        if (!res.ok) return [] as YouthPolicy[];
        const data = await res.json();
        return (data?.result?.youthPolicyList ?? []) as YouthPolicy[];
      }),
    );

    return pages.flat().filter(isActive).map(mapApiPolicy);
  } catch {
    return [];
  }
}

/** DB에서 정책을 조회합니다. */
export async function fetchAllYouthPolicies(): Promise<Recommendation[]> {
  try {
    const policies = await prisma.youthPolicy.findMany();
    return policies.map(mapDbPolicy);
  } catch (e) {
    console.error('[fetchAllYouthPolicies]', e);
    return [];
  }
}
