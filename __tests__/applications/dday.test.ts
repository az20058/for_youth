import { calculateDDay, formatDDay } from '@/lib/dday';

describe('calculateDDay', () => {
  it('마감일이 오늘인 경우 0을 반환한다', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(calculateDDay(today)).toBe(0);
  });

  it('마감일이 3일 후인 경우 3을 반환한다', () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    future.setHours(0, 0, 0, 0);
    expect(calculateDDay(future)).toBe(3);
  });

  it('마감일이 10일 후인 경우 10을 반환한다', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    future.setHours(0, 0, 0, 0);
    expect(calculateDDay(future)).toBe(10);
  });

  it('마감일이 2일 전인 경우 -2를 반환한다', () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    past.setHours(0, 0, 0, 0);
    expect(calculateDDay(past)).toBe(-2);
  });

  it('마감일이 1일 전인 경우 -1을 반환한다', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    expect(calculateDDay(yesterday)).toBe(-1);
  });
});

describe('formatDDay', () => {
  it('0이면 "D-0"을 반환한다', () => {
    expect(formatDDay(0)).toBe('D-0');
  });

  it('양수 5이면 "D-5" 형식으로 반환한다', () => {
    expect(formatDDay(5)).toBe('D-5');
  });

  it('양수 1이면 "D-1"을 반환한다', () => {
    expect(formatDDay(1)).toBe('D-1');
  });

  it('음수 -3이면 "D+3" 형식으로 반환한다 (마감 지남)', () => {
    expect(formatDDay(-3)).toBe('D+3');
  });

  it('음수 -1이면 "D+1"을 반환한다', () => {
    expect(formatDDay(-1)).toBe('D+1');
  });
});
