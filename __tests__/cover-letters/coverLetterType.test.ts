import {
  COVER_LETTER_TYPES,
  filterCoverLettersByType,
  groupCoverLettersByType,
  getCoverLetterTypeCount,
} from '@/lib/coverLetterType';
import type { CoverLetterType, CoverLetterWithApplication } from '@/lib/types';

const mockItems: CoverLetterWithApplication[] = [
  {
    coverLetterId: 'cl-1',
    question: '지원 동기를 서술해주세요',
    answer: '성장 가능성이 높아 지원합니다.',
    type: '지원 동기',
    applicationId: 'app-1',
    companyName: '카카오',
  },
  {
    coverLetterId: 'cl-2',
    question: '성장 과정을 작성해주세요',
    answer: '어릴 때부터 개발에 관심이 있었습니다.',
    type: '성장 과정',
    applicationId: 'app-1',
    companyName: '카카오',
  },
  {
    coverLetterId: 'cl-3',
    question: '왜 지원하셨나요',
    answer: '기술 스택이 맞아서 지원합니다.',
    type: '지원 동기',
    applicationId: 'app-2',
    companyName: '네이버',
  },
  {
    coverLetterId: 'cl-4',
    question: '강점을 서술해주세요',
    answer: '꼼꼼한 성격입니다.',
    type: null,
    applicationId: 'app-2',
    companyName: '네이버',
  },
  {
    coverLetterId: 'cl-5',
    question: '직무 관련 경험',
    answer: '인턴 경험이 있습니다.',
    type: '직무 역량',
    applicationId: 'app-3',
    companyName: '토스',
  },
];

describe('COVER_LETTER_TYPES', () => {
  it('모든 자기소개서 타입을 포함한다', () => {
    const expectedTypes: CoverLetterType[] = [
      '지원 동기',
      '성장 과정',
      '직무 역량',
      '성격 장단점',
      '입사 후 포부',
      '기타',
    ];
    expectedTypes.forEach((type) => {
      expect(COVER_LETTER_TYPES).toContain(type);
    });
  });

  it('6개의 타입을 가진다', () => {
    expect(COVER_LETTER_TYPES).toHaveLength(6);
  });
});

describe('filterCoverLettersByType', () => {
  it('특정 타입으로 필터링하면 해당 타입만 반환한다', () => {
    const result = filterCoverLettersByType(mockItems, '지원 동기');
    expect(result).toHaveLength(2);
    result.forEach((item) => expect(item.type).toBe('지원 동기'));
  });

  it('타입이 null이면 모든 항목을 반환한다', () => {
    const result = filterCoverLettersByType(mockItems, null);
    expect(result).toHaveLength(mockItems.length);
  });

  it('해당 타입의 항목이 없으면 빈 배열을 반환한다', () => {
    const result = filterCoverLettersByType(mockItems, '입사 후 포부');
    expect(result).toHaveLength(0);
  });

  it('미지정(null 타입) 항목만 필터링할 수 있다', () => {
    const result = filterCoverLettersByType(mockItems, null, { unassignedOnly: true });
    expect(result).toHaveLength(1);
    expect(result[0].coverLetterId).toBe('cl-4');
  });

  it('원본 배열을 변경하지 않는다', () => {
    const original = [...mockItems];
    filterCoverLettersByType(mockItems, '지원 동기');
    expect(mockItems).toEqual(original);
  });
});

describe('groupCoverLettersByType', () => {
  it('타입별로 항목을 그룹화한다', () => {
    const result = groupCoverLettersByType(mockItems);
    expect(result['지원 동기']).toHaveLength(2);
    expect(result['성장 과정']).toHaveLength(1);
    expect(result['직무 역량']).toHaveLength(1);
  });

  it('미지정 항목을 "미지정" 키로 그룹화한다', () => {
    const result = groupCoverLettersByType(mockItems);
    expect(result['미지정']).toHaveLength(1);
    expect(result['미지정'][0].coverLetterId).toBe('cl-4');
  });

  it('항목이 없는 타입은 빈 배열을 가진다', () => {
    const result = groupCoverLettersByType(mockItems);
    expect(result['성격 장단점']).toHaveLength(0);
    expect(result['입사 후 포부']).toHaveLength(0);
    expect(result['기타']).toHaveLength(0);
  });

  it('모든 타입 키를 포함한다', () => {
    const result = groupCoverLettersByType(mockItems);
    const expectedKeys = [...COVER_LETTER_TYPES, '미지정'];
    expectedKeys.forEach((key) => {
      expect(result).toHaveProperty(key);
    });
  });
});

describe('getCoverLetterTypeCount', () => {
  it('각 타입의 항목 수를 반환한다', () => {
    const result = getCoverLetterTypeCount(mockItems);
    expect(result['지원 동기']).toBe(2);
    expect(result['성장 과정']).toBe(1);
    expect(result['직무 역량']).toBe(1);
  });

  it('미지정 항목의 수를 반환한다', () => {
    const result = getCoverLetterTypeCount(mockItems);
    expect(result['미지정']).toBe(1);
  });

  it('항목이 없는 타입은 0을 반환한다', () => {
    const result = getCoverLetterTypeCount(mockItems);
    expect(result['성격 장단점']).toBe(0);
    expect(result['입사 후 포부']).toBe(0);
    expect(result['기타']).toBe(0);
  });

  it('빈 배열이면 모든 타입의 수가 0이다', () => {
    const result = getCoverLetterTypeCount([]);
    ([...COVER_LETTER_TYPES, '미지정'] as (CoverLetterType | '미지정')[]).forEach((type) => {
      expect(result[type]).toBe(0);
    });
  });
});
