import { policyMatchesUserRegion, scoreAndFilterPrograms } from '@/lib/recommendUtils';
import type { Recommendation } from '@/lib/quiz';

describe('policyMatchesUserRegion', () => {
  const SIHEUNG = '41390';
  const BUCHEON = '41190';
  const SIDO_GG = '41';

  it('zipCodes 비어있음 → 전국 정책 → 통과', () => {
    expect(policyMatchesUserRegion({ zipCodes: '' }, SIDO_GG, SIHEUNG)).toBe(true);
    expect(policyMatchesUserRegion({ zipCodes: null }, SIDO_GG, SIHEUNG)).toBe(true);
  });

  it('사용자 시군구코드 일치 zip 포함 → 통과', () => {
    expect(policyMatchesUserRegion({ zipCodes: '41390' }, SIDO_GG, SIHEUNG)).toBe(true);
    expect(policyMatchesUserRegion({ zipCodes: '41110,41390,41190' }, SIDO_GG, SIHEUNG)).toBe(true);
  });

  it('같은 시도의 다른 시군구만 → 제외', () => {
    expect(policyMatchesUserRegion({ zipCodes: BUCHEON }, SIDO_GG, SIHEUNG)).toBe(false);
    expect(policyMatchesUserRegion({ zipCodes: '41190,41110' }, SIDO_GG, SIHEUNG)).toBe(false);
  });

  it('다른 시도 zip만 → 제외', () => {
    expect(policyMatchesUserRegion({ zipCodes: '11000' }, SIDO_GG, SIHEUNG)).toBe(false);
  });

  it('사용자 시군구코드 미상이면 시도 매칭으로만 판정', () => {
    expect(policyMatchesUserRegion({ zipCodes: BUCHEON }, SIDO_GG, undefined)).toBe(true);
    expect(policyMatchesUserRegion({ zipCodes: '11000' }, SIDO_GG, undefined)).toBe(false);
  });

  it('사용자 시도 미상이면 zip이 있는 정책은 모두 제외', () => {
    expect(policyMatchesUserRegion({ zipCodes: '41390' }, undefined, undefined)).toBe(false);
    expect(policyMatchesUserRegion({ zipCodes: '' }, undefined, undefined)).toBe(true);
  });
});

describe('scoreAndFilterPrograms 지역 strict 필터', () => {
  const base: Omit<Recommendation, 'zipCodes'> = {
    name: '청년 일자리', agency: '경기도', mainCategory: '일자리',
    category: '취업지원', description: '청년 취업 지원', matchReason: '',
  };
  const policies: Recommendation[] = [
    { ...base, name: '시흥시 일자리', zipCodes: '41390' },
    { ...base, name: '부천시 일자리', zipCodes: '41190' },
    { ...base, name: '경기 일자리(도 단위)', zipCodes: '41110,41190,41390,41210' },
    { ...base, name: '전국 일자리', zipCodes: '' },
    { ...base, name: '서울 일자리', zipCodes: '11000' },
  ];

  it('시흥시 거주자(sigunguCode=41390)는 부천시·서울 정책이 제외된다', () => {
    const out = scoreAndFilterPrograms(
      policies,
      { need: ['employment'], region: '41', sigunguCode: '41390' },
      2,
    );
    const names = out.map((p) => p.name);
    expect(names).toContain('시흥시 일자리');
    expect(names).toContain('경기 일자리(도 단위)');
    expect(names).toContain('전국 일자리');
    expect(names).not.toContain('부천시 일자리');
    expect(names).not.toContain('서울 일자리');
  });
});
