import {
  countCharacters,
  countCharactersWithoutSpaces,
} from '@/lib/coverLetter';
import type { SpellingError } from '@/lib/coverLetter';

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
    expect(countCharacters('안녕 hello')).toBe(9);
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
