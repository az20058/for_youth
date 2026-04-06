import { isAnswered, toggleMultiChoice } from '@/lib/quizUtils';
import { buildPrompt, getSamplePrograms } from '@/lib/recommendUtils';
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

  describe('select (skippable)', () => {
    it('값이 없어도 skippable이면 true', () => {
      expect(isAnswered(selectQ, undefined)).toBe(true);
    });

    it('값이 있어도 true', () => {
      expect(isAnswered(selectQ, '서울')).toBe(true);
    });
  });

  describe('number (skippable)', () => {
    it('값이 없어도 skippable이면 true', () => {
      expect(isAnswered(numberQ, undefined)).toBe(true);
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

// ── getSamplePrograms ────────────────────────────────────────────────────────

describe('getSamplePrograms', () => {
  it('비어있지 않은 문자열을 반환한다', () => {
    expect(getSamplePrograms().length).toBeGreaterThan(0);
  });

  it('여러 프로그램이 포함된다', () => {
    const lines = getSamplePrograms().split('\n').filter((l) => l.startsWith('-'));
    expect(lines.length).toBeGreaterThan(1);
  });

  it('각 항목은 파이프(|) 구분자 형식이다', () => {
    const lines = getSamplePrograms().split('\n').filter((l) => l.startsWith('-'));
    lines.forEach((line) => {
      expect(line).toContain('|');
    });
  });
});

// ── buildPrompt ──────────────────────────────────────────────────────────────

describe('buildPrompt', () => {
  const programs = '- 청년내일채움공제 (취업지원) | 고용노동부';

  it('필요 항목이 한국어로 변환되어 포함된다', () => {
    const prompt = buildPrompt({ need: ['employment', 'financial'] }, programs);
    expect(prompt).toContain('취업·창업 지원');
    expect(prompt).toContain('경제적 지원');
  });

  it('거주 지역이 포함된다', () => {
    const prompt = buildPrompt({ region: '서울' }, programs);
    expect(prompt).toContain('거주 지역: 서울');
  });

  it('나이가 포함된다', () => {
    const prompt = buildPrompt({ age: 25 }, programs);
    expect(prompt).toContain('나이: 25세');
  });

  it('취업 상태가 한국어로 변환된다', () => {
    const prompt = buildPrompt({ status: 'job_seeking' }, programs);
    expect(prompt).toContain('취업 준비 중');
  });

  it('소득 상황이 한국어로 변환된다', () => {
    const prompt = buildPrompt({ income: 'basic_welfare' }, programs);
    expect(prompt).toContain('기초생활수급자');
  });

  it('자유 텍스트가 포함된다', () => {
    const prompt = buildPrompt({ freetext: '이직을 고민 중입니다' }, programs);
    expect(prompt).toContain('이직을 고민 중입니다');
  });

  it('null 값은 프롬프트에 포함되지 않는다', () => {
    const prompt = buildPrompt({ region: null }, programs);
    expect(prompt).not.toContain('거주 지역');
  });

  it('프로그램 목록이 포함된다', () => {
    const prompt = buildPrompt({}, programs);
    expect(prompt).toContain('청년내일채움공제');
  });

  it('JSON 형식으로 답하라는 지시가 포함된다', () => {
    const prompt = buildPrompt({}, programs);
    expect(prompt).toContain('JSON 배열 형식');
  });
});
