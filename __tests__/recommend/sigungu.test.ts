import { scoreAndRankPrograms } from '@/lib/recommendUtils';
import type { Recommendation } from '@/lib/quiz';

const base: Recommendation = {
  name: '청년 지원', agency: '고용노동부', mainCategory: '일자리',
  category: '취업지원', description: '테스트', matchReason: '',
};

describe('시군구 매칭', () => {
  it('agency에 시군구명 포함 시 상위 랭크', () => {
    const programs: Recommendation[] = [
      { ...base, name: '전국 청년 지원', agency: '고용노동부' },
      { ...base, name: '시흥시 청년 일자리', agency: '시흥시청' },
    ];
    const answers = { need: ['employment'], region: '41', sigungu: '시흥시' };
    const result = scoreAndRankPrograms(programs, answers);
    expect(result[0].agency).toBe('시흥시청');
  });

  it('name에 시군구명 포함 시 상위 랭크', () => {
    const programs: Recommendation[] = [
      { ...base, name: '전국 청년 지원', agency: '고용노동부' },
      { ...base, name: '성남시 청년 창업 지원', agency: '경기도' },
    ];
    const answers = { need: ['employment'], region: '41', sigungu: '성남시' };
    const result = scoreAndRankPrograms(programs, answers);
    expect(result[0].name).toBe('성남시 청년 창업 지원');
  });

  it('시/군/구 접미사 없는 정책명도 매칭 (천안시 → 천안)', () => {
    const programs: Recommendation[] = [
      { ...base, name: '천안 청년 지원', agency: '충청남도' },
      { ...base, name: '전국 청년 지원', agency: '고용노동부' },
    ];
    const answers = { need: ['employment'], region: '44', sigungu: '천안시' };
    const result = scoreAndRankPrograms(programs, answers);
    expect(result[0].name).toBe('천안 청년 지원');
  });

  it('sigungu 없으면 기존 SIDO 매칭만 사용', () => {
    const programs: Recommendation[] = [
      { ...base, name: '서울 지원', zipCodes: '11000' },
      { ...base, name: '경기 지원', zipCodes: '41000' },
    ];
    const answers = { need: ['employment'], region: '41' };
    const result = scoreAndRankPrograms(programs, answers);
    expect(result[0].name).toBe('경기 지원');
  });
});
