import type { CoverLetterType, CoverLetterWithApplication } from './types';

export const COVER_LETTER_TYPES: CoverLetterType[] = [
  '지원 동기',
  '성장 과정',
  '직무 역량',
  '성격 장단점',
  '입사 후 포부',
  '기타',
];

type FilterOptions = { unassignedOnly?: boolean };

export function filterCoverLettersByType(
  items: CoverLetterWithApplication[],
  type: CoverLetterType | null,
  options?: FilterOptions
): CoverLetterWithApplication[] {
  if (options?.unassignedOnly) {
    return items.filter((item) => item.type === null);
  }
  if (type === null) {
    return [...items];
  }
  return items.filter((item) => item.type === type);
}

type GroupedCoverLetters = Record<CoverLetterType | '미지정', CoverLetterWithApplication[]>;

export function groupCoverLettersByType(
  items: CoverLetterWithApplication[]
): GroupedCoverLetters {
  const result: GroupedCoverLetters = {
    '지원 동기': [],
    '성장 과정': [],
    '직무 역량': [],
    '성격 장단점': [],
    '입사 후 포부': [],
    기타: [],
    미지정: [],
  };

  for (const item of items) {
    if (item.type === null) {
      result['미지정'].push(item);
    } else {
      result[item.type].push(item);
    }
  }

  return result;
}

type TypeCount = Record<CoverLetterType | '미지정', number>;

export function getCoverLetterTypeCount(items: CoverLetterWithApplication[]): TypeCount {
  const grouped = groupCoverLettersByType(items);
  return Object.fromEntries(
    Object.entries(grouped).map(([key, val]) => [key, val.length])
  ) as TypeCount;
}
