import { todayKstStart, addDays, kstDateKey, isSameKstDay } from '@/lib/dateKst';

describe('todayKstStart', () => {
  it('KST 00:00에 해당하는 UTC Date를 반환한다', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-23T03:00:00.000Z'));
    expect(todayKstStart().toISOString()).toBe('2026-04-22T15:00:00.000Z');
    jest.useRealTimers();
  });
});

describe('addDays', () => {
  it('N일을 더한 Date를 반환한다', () => {
    const base = new Date('2026-04-22T15:00:00.000Z');
    expect(addDays(base, 3).toISOString()).toBe('2026-04-25T15:00:00.000Z');
  });
});

describe('kstDateKey', () => {
  it('YYYY-MM-DD (KST) 문자열을 반환한다', () => {
    expect(kstDateKey(new Date('2026-04-22T15:00:00.000Z'))).toBe('2026-04-23');
    expect(kstDateKey(new Date('2026-04-22T14:59:59.999Z'))).toBe('2026-04-22');
  });
});

describe('isSameKstDay', () => {
  it('같은 KST 날짜면 true', () => {
    expect(isSameKstDay(new Date('2026-04-22T15:00:00.000Z'), new Date('2026-04-23T14:59:00.000Z'))).toBe(true);
  });
  it('다른 KST 날짜면 false', () => {
    expect(isSameKstDay(new Date('2026-04-22T14:59:00.000Z'), new Date('2026-04-22T15:00:00.000Z'))).toBe(false);
  });
});
