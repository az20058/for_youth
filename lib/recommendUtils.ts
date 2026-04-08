import type { QuizAnswers, Recommendation } from './quiz';
import { SIDO_REGIONS } from './quiz';

const SIDO_CODE_TO_NAME: Record<string, string> = Object.fromEntries(
  SIDO_REGIONS.map((r) => [r.code, r.name]),
);

// need 값 → 대분류 키워드 매핑
const NEED_TO_CATEGORIES: Record<string, string[]> = {
  employment: ['일자리', '교육'],
  mental:     ['복지문화'],
  social:     ['참여권리', '복지문화'],
  financial:  ['복지문화', '주거'],
  other:      [],
};

// status 값 → 정책 텍스트 키워드 매핑
const STATUS_KEYWORDS: Record<string, string[]> = {
  job_seeking: ['미취업', '취업', '구직', '취준'],
  student:     ['재학', '학생', '대학', '학자금'],
  employed:    ['재직', '근로자', '근속'],
  startup:     ['창업', '예비창업'],
  none:        [],
};

// income 값 → 정책 텍스트 키워드 매핑
const INCOME_KEYWORDS: Record<string, string[]> = {
  basic_welfare: ['기초생활', '수급'],
  near_poverty:  ['차상위', '기초'],
  below_median:  ['저소득', '중위소득'],
  general:       [],
};

function generateMatchReason(program: Recommendation, answers: QuizAnswers): string {
  const reasons: string[] = [];

  const needs = (answers.need as string[] | undefined) ?? [];
  for (const need of needs) {
    const cats = NEED_TO_CATEGORIES[need] ?? [];
    if (cats.some((c) => program.mainCategory?.includes(c))) {
      if (need === 'employment') reasons.push('취업·창업 지원을 원하는 분께 적합합니다.');
      else if (need === 'mental') reasons.push('마음 건강 지원이 필요한 분께 적합합니다.');
      else if (need === 'social') reasons.push('사회적 연결을 원하는 분께 적합합니다.');
      else if (need === 'financial') reasons.push('경제적 지원이 필요한 분께 적합합니다.');
      break;
    }
  }

  const region = answers.region as string | undefined;
  const validRegionCodes = (program.zipCodes || '').split(',').map((c) => c.trim()).filter((c) => /^\d{5}$/.test(c));
  if (region && validRegionCodes.some((c) => c.startsWith(region))) {
    const regionName = SIDO_CODE_TO_NAME[region] ?? region;
    reasons.push(`${regionName} 거주자를 대상으로 합니다.`);
  }

  const status = answers.status as string | undefined;
  if (status && STATUS_KEYWORDS[status]) {
    const searchText = `${program.name} ${program.category} ${program.description}`.toLowerCase();
    if (STATUS_KEYWORDS[status].some((kw) => searchText.includes(kw))) {
      if (status === 'job_seeking') reasons.push('취업 준비 중인 분께 잘 맞는 지원입니다.');
      else if (status === 'student') reasons.push('재학생을 위한 지원입니다.');
      else if (status === 'startup') reasons.push('창업 준비생을 위한 지원입니다.');
      else if (status === 'employed') reasons.push('재직자를 위한 지원입니다.');
    }
  }

  return reasons.slice(0, 2).join(' ') || '청년 지원 정책입니다.';
}

export function scoreAndRankPrograms(
  programs: Recommendation[],
  answers: QuizAnswers,
  topN = 10,
): Recommendation[] {
  const needs = (answers.need as string[] | undefined) ?? [];
  const userRegion = answers.region as string | undefined;
  const status = answers.status as string | undefined;
  const income = answers.income as string | undefined;
  const freetext = answers.freetext as string | undefined;
  const freetextKeywords = freetext
    ? freetext.split(/\s+/).filter((k) => k.length > 1)
    : [];

  const scored = programs.map((p) => {
    let score = 0;
    const searchText = `${p.name} ${p.mainCategory} ${p.category} ${p.description}`.toLowerCase();

    // need → mainCategory 매칭 (가장 중요)
    for (const need of needs) {
      const cats = NEED_TO_CATEGORIES[need] ?? [];
      if (cats.some((c) => p.mainCategory?.includes(c))) {
        score += 3;
        break;
      }
    }

    // 지역 매칭 (SIDO 코드 prefix 비교)
    if (userRegion) {
      const validCodes = (p.zipCodes || '')
        .split(',')
        .map((c) => c.trim())
        .filter((c) => /^\d{5}$/.test(c));
      if (validCodes.length === 0) {
        score += 1; // zipCd 없는 전국 정책
      } else if (validCodes.some((c) => c.startsWith(userRegion))) {
        score += 2;
      }
    }

    // 취업 상태 매칭
    if (status && STATUS_KEYWORDS[status]) {
      if (STATUS_KEYWORDS[status].some((kw) => searchText.includes(kw))) score += 1;
    }

    // 소득 조건 매칭
    if (income && INCOME_KEYWORDS[income]) {
      if (INCOME_KEYWORDS[income].some((kw) => searchText.includes(kw))) score += 1;
    }

    // 자유 텍스트 키워드 매칭
    for (const kw of freetextKeywords) {
      if (searchText.includes(kw.toLowerCase())) score += 0.5;
    }

    return { program: p, score };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || (b.program.viewCount ?? 0) - (a.program.viewCount ?? 0))
    .slice(0, topN)
    .map(({ program }) => ({
      ...program,
      matchReason: generateMatchReason(program, answers),
    }));
}

/** 전체 프로그램 목록 (API 실패 시 fallback) */
export const ALL_PROGRAMS: Recommendation[] = [
  {
    name: '청년내일채움공제', agency: '고용노동부', mainCategory: '일자리', category: '취업지원',
    description: '중소기업에 취업한 청년이 2년 근속 시 본인 납입금 + 기업·정부 지원금 합산 최대 1,200만원을 적립받는 제도입니다.',
    matchReason: '', viewCount: 58420, applicationUrl: 'https://www.work.go.kr',
  },
  {
    name: '국민취업지원제도', agency: '고용노동부', mainCategory: '일자리', category: '취업지원',
    description: '취업 취약계층 청년에게 맞춤형 취업지원서비스와 함께 최대 300만원의 구직촉진수당을 지원합니다.',
    matchReason: '', viewCount: 47300, applicationUrl: 'https://www.work24.go.kr',
  },
  {
    name: '청년도약계좌', agency: '금융위원회', mainCategory: '복지문화', category: '금융지원',
    description: '매월 40~70만원 납입 시 정부 기여금 + 비과세 혜택으로 5년 만기 최대 5,000만원을 마련할 수 있는 적금입니다.',
    matchReason: '', viewCount: 41200, applicationUrl: 'https://www.kinfa.or.kr',
  },
  {
    name: '청년월세 특별지원', agency: '국토교통부', mainCategory: '주거', category: '주거지원',
    description: '보증금 5천만원·월세 60만원 이하 주택에 거주하는 청년에게 월 최대 20만원씩 최대 12개월간 월세를 지원합니다.',
    matchReason: '', viewCount: 35800, applicationUrl: 'https://www.myhome.go.kr',
  },
  {
    name: '대학생 학자금대출', agency: '한국장학재단', mainCategory: '교육', category: '교육지원',
    description: '재학 중 등록금과 생활비를 저금리로 대출받고, 졸업 후 소득이 생기면 상환하는 소득연계형 학자금 지원 제도입니다.',
    matchReason: '', viewCount: 31500, applicationUrl: 'https://www.kosaf.go.kr',
  },
  {
    name: '청년마음건강지원사업', agency: '보건복지부', mainCategory: '복지문화', category: '심리지원',
    description: '심리적 어려움을 겪는 청년에게 전문 심리상담 바우처를 최대 100만원 지원해 정신건강 회복을 돕습니다.',
    matchReason: '', viewCount: 18900, applicationUrl: 'https://www.mohw.go.kr',
  },
  {
    name: '청년창업사관학교', agency: '중소벤처기업부', mainCategory: '일자리', category: '창업지원',
    description: '창업을 준비하는 청년에게 교육·멘토링·공간·사업화 자금 최대 1억원을 패키지로 지원하는 창업 프로그램입니다.',
    matchReason: '', viewCount: 23150, applicationUrl: 'https://www.k-startup.go.kr',
  },
  {
    name: '희망두배 청년통장', agency: '서울시', mainCategory: '복지문화', category: '금융지원',
    description: '서울 거주 저소득 청년이 2년간 매월 저축하면 서울시가 동일 금액을 매칭해 최대 2배 적립해 주는 자산형성 지원 사업입니다.',
    matchReason: '', viewCount: 9800, applicationUrl: 'https://www.seoul.go.kr', region: '서울',
  },
];
