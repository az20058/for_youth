import {
  countCharacters,
  countCharactersWithoutSpaces,
  calculateTypoPositions,
  applyCorrections,
} from '@/lib/coverLetter';
import type { SpellingError, RawTypo } from '@/lib/coverLetter';

describe('countCharacters', () => {
  it('빈 문자열은 0을 반환한다', () => {
    expect(countCharacters('')).toBe(0);
  });

  it('한글 텍스트의 글자 수를 반환한다', () => {
    expect(countCharacters('안녕하세요')).toBe(5);
  });

  it('공백을 포함하여 글자 수를 반환한다', () => {
    expect(countCharacters('안녕 하세요')).toBe(6);
  });

  it('줄바꿈 문자를 포함하여 글자 수를 반환한다', () => {
    expect(countCharacters('안녕\n하세요')).toBe(6);
  });

  it('영문자도 정상적으로 집계한다', () => {
    expect(countCharacters('hello')).toBe(5);
  });

  it('혼합 텍스트의 글자 수를 반환한다', () => {
    expect(countCharacters('안녕 hello')).toBe(8);
  });
});

describe('countCharactersWithoutSpaces', () => {
  it('빈 문자열은 0을 반환한다', () => {
    expect(countCharactersWithoutSpaces('')).toBe(0);
  });

  it('공백을 제외한 글자 수를 반환한다', () => {
    expect(countCharactersWithoutSpaces('안녕 하세요')).toBe(5);
  });

  it('여러 공백을 모두 제외한다', () => {
    expect(countCharactersWithoutSpaces('안녕  하  세요')).toBe(5);
  });

  it('줄바꿈도 공백으로 취급하여 제외한다', () => {
    expect(countCharactersWithoutSpaces('안녕\n하세요')).toBe(5);
  });

  it('탭 문자도 제외한다', () => {
    expect(countCharactersWithoutSpaces('안녕\t하세요')).toBe(5);
  });

  it('공백이 없으면 countCharacters와 같은 값을 반환한다', () => {
    expect(countCharactersWithoutSpaces('안녕하세요')).toBe(5);
  });
});

describe('SpellingError 타입', () => {
  it('SpellingError는 필요한 필드를 가진다', () => {
    const error: SpellingError = {
      original: '왜냐면',
      suggestion: '왜냐하면',
      startIndex: 10,
      endIndex: 13,
      message: '맞춤법 오류: "왜냐면"은 "왜냐하면"으로 써야 합니다.',
    };
    expect(error.original).toBe('왜냐면');
    expect(error.suggestion).toBe('왜냐하면');
    expect(error.startIndex).toBe(10);
    expect(error.endIndex).toBe(13);
    expect(error.message).toBeDefined();
  });
});

describe('calculateTypoPositions', () => {
  const makeRaw = (token: string, suggestions: string[]): RawTypo => ({
    token,
    suggestions,
    type: 'spell',
    context: '',
  });

  it('단어 위치를 올바르게 계산한다', () => {
    const text = '나는 밥을 먹었다';
    const result = calculateTypoPositions(text, [makeRaw('먹었다', ['먹었다'])]);
    expect(result[0].start).toBe(6);
    expect(result[0].end).toBe(9);
  });

  it('텍스트에 없는 token은 무시한다', () => {
    const text = '안녕하세요';
    const result = calculateTypoPositions(text, [makeRaw('없는단어', ['대체'])]);
    expect(result).toHaveLength(0);
  });

  it('여러 오류를 순서대로 처리한다', () => {
    const text = '오류A 정상 오류B';
    const result = calculateTypoPositions(text, [
      makeRaw('오류A', ['정상A']),
      makeRaw('오류B', ['정상B']),
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].token).toBe('오류A');
    expect(result[1].token).toBe('오류B');
  });

  it('같은 단어가 두 번 나오면 두 번째 위치를 반환한다', () => {
    const text = '반복 반복';
    const result = calculateTypoPositions(text, [
      makeRaw('반복', ['대체1']),
      makeRaw('반복', ['대체2']),
    ]);
    expect(result[0].start).toBe(0);
    expect(result[1].start).toBe(3);
  });
});

describe('applyCorrections', () => {
  it('선택된 교정안을 텍스트에 반영한다', () => {
    const text = '어떡해 되나요';
    const typos = [{ token: '어떡해', suggestions: ['어떻게'], start: 0, end: 3 }];
    const result = applyCorrections(text, { 0: '어떻게' }, typos);
    expect(result).toBe('어떻게 되나요');
  });

  it('교정안이 없는 오류는 원문 유지한다', () => {
    const text = '어떡해 되나요';
    const typos = [{ token: '어떡해', suggestions: ['어떻게'], start: 0, end: 3 }];
    const result = applyCorrections(text, {}, typos);
    expect(result).toBe('어떡해 되나요');
  });

  it('여러 교정안을 뒤에서부터 반영해 인덱스 밀림을 방지한다', () => {
    const text = 'AA BB CC';
    const typos = [
      { token: 'AA', suggestions: ['XX'], start: 0, end: 2 },
      { token: 'BB', suggestions: ['YY'], start: 3, end: 5 },
    ];
    const result = applyCorrections(text, { 0: 'XX', 3: 'YY' }, typos);
    expect(result).toBe('XX YY CC');
  });
});
