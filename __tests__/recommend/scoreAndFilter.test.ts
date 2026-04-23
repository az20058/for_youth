import { scoreAndFilterPrograms } from '@/lib/recommendUtils';
import type { Recommendation } from '@/lib/quiz';

const policies: Recommendation[] = [
  { name: '서울 일자리 지원', agency: '서울시', mainCategory: '일자리', category: '취업지원',
    description: '서울 거주 청년 취업', matchReason: '', zipCodes: '11000' },
  { name: '무관한 복지', agency: '보건부', mainCategory: '복지문화', category: '복지',
    description: '일반 복지', matchReason: '' },
];

describe('scoreAndFilterPrograms', () => {
  it('임계치 이상인 정책만 반환한다', () => {
    const out = scoreAndFilterPrograms(policies, { need: ['employment'], region: '11' }, 2);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('서울 일자리 지원');
  });
  it('임계치를 만족하는 정책이 없으면 빈 배열', () => {
    const out = scoreAndFilterPrograms(policies, { need: ['mental'], region: '26' }, 5);
    expect(out).toEqual([]);
  });
  it('퀴즈 답변이 비었으면 빈 배열', () => {
    expect(scoreAndFilterPrograms(policies, {}, 2)).toEqual([]);
  });
});
