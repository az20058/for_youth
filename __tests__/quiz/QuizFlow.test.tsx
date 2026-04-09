import { isAnswered, toggleMultiChoice } from '@/lib/quizUtils';
import { QUIZ_QUESTIONS } from '@/lib/quiz';
import type { QuizQuestion } from '@/lib/quiz';

// ── isAnswered ──────────────────────────────────────────────────────────────

describe('isAnswered', () => {
  const multiChoice = QUIZ_QUESTIONS.find((q) => q.id === 'need')!;
  const selectQ = QUIZ_QUESTIONS.find((q) => q.id === 'region')!;
  const numberQ = QUIZ_QUESTIONS.find((q) => q.id === 'age')!;
  const textareaQ = QUIZ_QUESTIONS.find((q) => q.id === 'freetext')!;

  describe('multi-choice (필수)', () => {
    it('빈 배열이면 false', () => {
      expect(isAnswered(multiChoice, [])).toBe(false);
    });

    it('undefined이면 false', () => {
      expect(isAnswered(multiChoice, undefined)).toBe(false);
    });

    it('하나 이상 선택되면 true', () => {
      expect(isAnswered(multiChoice, ['employment'])).toBe(true);
    });

    it('여러 개 선택되어도 true', () => {
      expect(isAnswered(multiChoice, ['employment', 'financial'])).toBe(true);
    });
  });

  describe('select (필수)', () => {
    it('값이 없으면 false', () => {
      expect(isAnswered(selectQ, undefined)).toBe(false);
    });

    it('값이 있으면 true', () => {
      expect(isAnswered(selectQ, '서울')).toBe(true);
    });
  });

  describe('number (필수)', () => {
    it('값이 없으면 false', () => {
      expect(isAnswered(numberQ, undefined)).toBe(false);
    });

    it('값이 있으면 true', () => {
      expect(isAnswered(numberQ, 25)).toBe(true);
    });
  });

  describe('textarea (skippable)', () => {
    it('빈 문자열이어도 skippable이면 true', () => {
      expect(isAnswered(textareaQ, '')).toBe(true);
    });
  });

  describe('single-choice (skippable)', () => {
    const singleChoice: QuizQuestion = {
      id: 'status',
      question: '현재 상황',
      type: 'single-choice',
      skippable: true,
      options: [{ label: '취준생', value: 'job_seeking' }],
    };

    it('값이 없어도 skippable이면 true', () => {
      expect(isAnswered(singleChoice, undefined)).toBe(true);
    });

    it('값이 있으면 true', () => {
      expect(isAnswered(singleChoice, 'job_seeking')).toBe(true);
    });
  });

  describe('single-choice (필수)', () => {
    const required: QuizQuestion = {
      id: 'required_single',
      question: '필수 선택',
      type: 'single-choice',
      options: [{ label: '옵션1', value: 'a' }],
    };

    it('미선택이면 false', () => {
      expect(isAnswered(required, undefined)).toBe(false);
    });

    it('빈 문자열이면 false', () => {
      expect(isAnswered(required, '')).toBe(false);
    });

    it('값이 있으면 true', () => {
      expect(isAnswered(required, 'a')).toBe(true);
    });
  });
});

// ── toggleMultiChoice ────────────────────────────────────────────────────────

describe('toggleMultiChoice', () => {
  it('빈 배열에 값 추가', () => {
    expect(toggleMultiChoice([], 'employment')).toEqual(['employment']);
  });

  it('이미 있는 값 클릭하면 제거', () => {
    expect(toggleMultiChoice(['employment', 'financial'], 'employment')).toEqual(['financial']);
  });

  it('없는 값 추가', () => {
    expect(toggleMultiChoice(['employment'], 'financial')).toEqual(['employment', 'financial']);
  });

  it('마지막 항목 제거하면 빈 배열', () => {
    expect(toggleMultiChoice(['employment'], 'employment')).toEqual([]);
  });

  it('원본 배열을 변경하지 않는다 (불변성)', () => {
    const original = ['employment'];
    toggleMultiChoice(original, 'financial');
    expect(original).toEqual(['employment']);
  });
});

