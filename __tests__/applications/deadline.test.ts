import { formatDeadline } from '@/lib/deadline';

describe('formatDeadline', () => {
  it('날짜를 YYYY년 MM월 DD일 형식으로 반환한다', () => {
    const date = new Date('2026-06-15');
    expect(formatDeadline(date)).toBe('2026년 06월 15일');
  });

  it('월과 일이 한 자리 수일 때 앞에 0을 붙인다', () => {
    const date = new Date('2026-01-05');
    expect(formatDeadline(date)).toBe('2026년 01월 05일');
  });

  it('12월 31일도 올바르게 포맷한다', () => {
    const date = new Date('2026-12-31');
    expect(formatDeadline(date)).toBe('2026년 12월 31일');
  });
});
