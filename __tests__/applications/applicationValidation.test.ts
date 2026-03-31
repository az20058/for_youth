import { validateApplication } from '@/lib/applicationValidation';

const tomorrow = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
})();

const validData = {
  companyName: '네이버',
  careerLevel: '신입',
  deadline: tomorrow,
  companySize: '대기업',
  status: '지원 예정',
  coverLetters: [] as { id: string; question: string; answer: string; type: null }[],
};

describe('validateApplication', () => {
  it('유효한 데이터 → 에러 없음', () => {
    expect(validateApplication(validData)).toEqual({});
  });

  it('companyName 빈 문자열 → companyName 에러', () => {
    const result = validateApplication({ ...validData, companyName: '' });
    expect(result.companyName).toBeDefined();
  });

  it('companyName 공백만 → companyName 에러', () => {
    const result = validateApplication({ ...validData, companyName: '   ' });
    expect(result.companyName).toBeDefined();
  });

  it('careerLevel 빈 문자열 → careerLevel 에러', () => {
    const result = validateApplication({ ...validData, careerLevel: '' });
    expect(result.careerLevel).toBeDefined();
  });

  it('deadline 빈 문자열 → deadline 에러', () => {
    const result = validateApplication({ ...validData, deadline: '' });
    expect(result.deadline).toBeDefined();
  });

  it('과거 deadline → deadline 에러', () => {
    const result = validateApplication({ ...validData, deadline: '2020-01-01' });
    expect(result.deadline).toBeDefined();
  });

  it('오늘 deadline → 에러 없음', () => {
    const today = new Date().toISOString().split('T')[0];
    const result = validateApplication({ ...validData, deadline: today });
    expect(result.deadline).toBeUndefined();
  });

  it('잘못된 companySize → companySize 에러', () => {
    const result = validateApplication({ ...validData, companySize: '잘못된값' });
    expect(result.companySize).toBeDefined();
  });

  it('빈 companySize → companySize 에러', () => {
    const result = validateApplication({ ...validData, companySize: '' });
    expect(result.companySize).toBeDefined();
  });

  it('잘못된 status → status 에러', () => {
    const result = validateApplication({ ...validData, status: '잘못된상태' });
    expect(result.status).toBeDefined();
  });

  it('coverLetter question 빈 문자열 → coverLetters 에러', () => {
    const result = validateApplication({
      ...validData,
      coverLetters: [{ id: 'cl-1', question: '', answer: '', type: null }],
    });
    expect(result.coverLetters).toBeDefined();
  });

  it('coverLetter question 공백만 → coverLetters 에러', () => {
    const result = validateApplication({
      ...validData,
      coverLetters: [{ id: 'cl-1', question: '   ', answer: '', type: null }],
    });
    expect(result.coverLetters).toBeDefined();
  });

  it('coverLetter question 있으면 coverLetters 에러 없음', () => {
    const result = validateApplication({
      ...validData,
      coverLetters: [{ id: 'cl-1', question: '지원 동기를 써주세요', answer: '', type: null }],
    });
    expect(result.coverLetters).toBeUndefined();
  });
});
