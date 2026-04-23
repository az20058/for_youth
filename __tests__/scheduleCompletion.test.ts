import { isEventCompleted } from '@/lib/scheduleCompletion';

describe('isEventCompleted', () => {
  it('완료 표시된 이벤트는 true', () => {
    expect(isEventCompleted({ completedAt: new Date(), type: 'CODING_TEST' }, null)).toBe(true);
  });
  it('applicationId 없고 completedAt 없으면 false', () => {
    expect(isEventCompleted({ completedAt: null, type: 'CODING_TEST' }, null)).toBe(false);
  });
  it('CODING_TEST: 연결된 application이 INTERVIEW면 true', () => {
    expect(isEventCompleted({ completedAt: null, type: 'CODING_TEST' }, { status: 'INTERVIEW' })).toBe(true);
  });
  it('CODING_TEST: 연결된 application이 PENDING이면 false', () => {
    expect(isEventCompleted({ completedAt: null, type: 'CODING_TEST' }, { status: 'PENDING' })).toBe(false);
  });
  it('CODING_TEST: 모든 REJECTED_* 상태는 true', () => {
    (['REJECTED_DOCS', 'REJECTED_CODING', 'REJECTED_INTERVIEW'] as const).forEach((s) => {
      expect(isEventCompleted({ completedAt: null, type: 'CODING_TEST' }, { status: s })).toBe(true);
    });
  });
  it('INTERVIEW: APPLIED/ACCEPTED면 true, CODING_TEST이면 false', () => {
    expect(isEventCompleted({ completedAt: null, type: 'INTERVIEW' }, { status: 'APPLIED' })).toBe(true);
    expect(isEventCompleted({ completedAt: null, type: 'INTERVIEW' }, { status: 'ACCEPTED' })).toBe(true);
    expect(isEventCompleted({ completedAt: null, type: 'INTERVIEW' }, { status: 'CODING_TEST' })).toBe(false);
  });
  it('DOCUMENT: application이 PENDING이 아니면 true', () => {
    expect(isEventCompleted({ completedAt: null, type: 'DOCUMENT' }, { status: 'CODING_TEST' })).toBe(true);
    expect(isEventCompleted({ completedAt: null, type: 'DOCUMENT' }, { status: 'PENDING' })).toBe(false);
  });
  it('OTHER: completedAt만 보고 application 상태 무시', () => {
    expect(isEventCompleted({ completedAt: null, type: 'OTHER' }, { status: 'REJECTED_CODING' })).toBe(false);
  });
});
