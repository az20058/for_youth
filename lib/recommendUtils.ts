import type { QuizAnswers } from './quiz';

const NEED_LABELS: Record<string, string> = {
  employment: '취업·창업 지원',
  mental: '정신건강·심리 지원',
  social: '사회적 연결·커뮤니티',
  financial: '경제적 지원',
  other: '기타',
};

const STATUS_LABELS: Record<string, string> = {
  job_seeking: '취업 준비 중',
  student: '재학 중',
  employed: '재직 중',
  startup: '창업 준비 중',
  none: '해당 없음',
};

const INCOME_LABELS: Record<string, string> = {
  basic_welfare: '기초생활수급자',
  near_poverty: '차상위계층',
  below_median: '중위소득 이하',
  general: '일반 가정',
};

/** 퀴즈 답변을 AI 프롬프트 문자열로 변환 */
export function buildPrompt(answers: QuizAnswers, programs: string): string {
  const lines: string[] = ['[사용자 답변]'];

  if (answers.need) {
    const needs = (answers.need as string[]).map((v) => NEED_LABELS[v] ?? v).join(', ');
    lines.push(`- 필요한 것: ${needs}`);
  }
  if (answers.region) lines.push(`- 거주 지역: ${answers.region}`);
  if (answers.age) lines.push(`- 나이: ${answers.age}세`);
  if (answers.status) lines.push(`- 현재 상황: ${STATUS_LABELS[answers.status as string] ?? answers.status}`);
  if (answers.income) lines.push(`- 소득 상황: ${INCOME_LABELS[answers.income as string] ?? answers.income}`);
  if (answers.freetext) lines.push(`- 추가 사항: ${answers.freetext}`);

  return `당신은 대한민국 청년 지원 정책 전문가입니다.
아래 청년의 상황과 요청에 가장 잘 맞는 청년 지원 프로그램을 3~5개 추천해주세요.

${lines.join('\n')}

[이용 가능한 청년 지원 프로그램 목록]
${programs}

다음 JSON 배열 형식으로만 답하세요. 다른 텍스트는 포함하지 마세요.
[
  {
    "name": "프로그램명",
    "agency": "주관 기관",
    "mainCategory": "정책 대분류명 (예: 취업·창업, 주거, 교육, 금융·자산형성, 정신건강)",
    "category": "정책 중분류명 (예: 취업지원, 창업지원, 주거지원)",
    "description": "2~3문장 이내 간결한 설명",
    "matchReason": "이 사용자에게 추천하는 이유 (1~2문장)",
    "applicationUrl": "신청 URL (없으면 빈 문자열)"
  }
]`;
}

import type { Recommendation } from './quiz';

/** 프로그램명 → 조회수 매핑 (샘플 데이터) */
const PROGRAM_VIEW_COUNTS: Record<string, number> = {
  '청년내일채움공제': 58420,
  '국민취업지원제도': 47300,
  '청년도약계좌': 41200,
  '청년월세 특별지원': 35800,
  '청년 고용장려금': 28700,
  '대학생 학자금대출': 31500,
  '청년창업사관학교': 23150,
  '청년 주거급여 분리지급': 22400,
  '청년마음건강지원사업': 18900,
  '청년 정신건강 복지서비스': 15600,
  '청년문화예술패스': 12300,
  '희망두배 청년통장': 9800,
};

/** 전체 프로그램 목록 (조회수 포함) */
export const ALL_PROGRAMS: Recommendation[] = [
  {
    name: '청년내일채움공제', agency: '고용노동부', mainCategory: '취업·창업', category: '취업지원',
    description: '중소기업에 취업한 청년이 2년 근속 시 본인 납입금 + 기업·정부 지원금 합산 최대 1,200만원을 적립받는 제도입니다.',
    matchReason: '첫 직장 정착과 목돈 마련을 동시에 지원하는 청년 취업자 대표 프로그램입니다.',
    viewCount: 58420, applicationUrl: 'https://www.work.go.kr',
  },
  {
    name: '국민취업지원제도', agency: '고용노동부', mainCategory: '취업·창업', category: '취업지원',
    description: '취업 취약계층 청년에게 맞춤형 취업지원서비스와 함께 최대 300만원의 구직촉진수당을 지원합니다.',
    matchReason: '구직 활동 중 생활비 부담을 덜고 체계적인 취업 지원을 받을 수 있습니다.',
    viewCount: 47300, applicationUrl: 'https://www.work24.go.kr',
  },
  {
    name: '청년도약계좌', agency: '금융위원회', mainCategory: '금융·자산형성', category: '금융지원',
    description: '매월 40~70만원 납입 시 정부 기여금 + 비과세 혜택으로 5년 만기 최대 5,000만원을 마련할 수 있는 적금입니다.',
    matchReason: '경제적 자립을 원하는 청년의 장기 자산 형성에 최적화된 금융 지원 프로그램입니다.',
    viewCount: 41200, applicationUrl: 'https://www.kinfa.or.kr',
  },
  {
    name: '청년월세 특별지원', agency: '국토교통부', mainCategory: '주거', category: '주거지원',
    description: '보증금 5천만원·월세 60만원 이하 주택에 거주하는 청년에게 월 최대 20만원씩 최대 12개월간 월세를 지원합니다.',
    matchReason: '주거비 부담이 큰 청년 1인 가구에게 즉각적인 현금 지원을 제공합니다.',
    viewCount: 35800, applicationUrl: 'https://www.myhome.go.kr',
  },
  {
    name: '대학생 학자금대출', agency: '한국장학재단', mainCategory: '교육', category: '교육지원',
    description: '재학 중 등록금과 생활비를 저금리로 대출받고, 졸업 후 소득이 생기면 상환하는 소득연계형 학자금 지원 제도입니다.',
    matchReason: '경제적 부담 없이 학업에 집중할 수 있도록 돕는 대표적인 교육 금융 지원입니다.',
    viewCount: 31500, applicationUrl: 'https://www.kosaf.go.kr',
  },
  {
    name: '청년 고용장려금', agency: '고용노동부', mainCategory: '취업·창업', category: '취업지원',
    description: '중소·중견기업에 취업한 청년에게 3년간 최대 720만원의 장려금을 지급해 청년 고용을 촉진하는 제도입니다.',
    matchReason: '중소기업 취업을 고려하는 청년에게 추가적인 경제적 인센티브를 제공합니다.',
    viewCount: 28700, applicationUrl: 'https://www.work.go.kr',
  },
  {
    name: '청년창업사관학교', agency: '중소벤처기업부', mainCategory: '취업·창업', category: '창업지원',
    description: '창업을 준비하는 청년에게 교육·멘토링·공간·사업화 자금 최대 1억원을 패키지로 지원하는 밀착형 창업 프로그램입니다.',
    matchReason: '아이디어와 열정이 있는 청년 창업자에게 실질적인 자금과 전문가 네트워크를 연결해 드립니다.',
    viewCount: 23150, applicationUrl: 'https://www.k-startup.go.kr',
  },
  {
    name: '청년 주거급여 분리지급', agency: '국토교통부', mainCategory: '주거', category: '주거지원',
    description: '주거급여 수급 가구의 청년이 부모와 별도로 거주할 경우, 독립한 청년에게 주거급여를 별도로 지급합니다.',
    matchReason: '저소득 가구 청년의 독립 생활을 직접적으로 지원하는 주거 안전망 제도입니다.',
    viewCount: 22400, applicationUrl: 'https://www.myhome.go.kr',
  },
  {
    name: '청년마음건강지원사업', agency: '보건복지부', mainCategory: '정신건강', category: '심리지원',
    description: '심리적 어려움을 겪는 청년에게 전문 심리상담 바우처를 최대 100만원 지원해 정신건강 회복을 돕습니다.',
    matchReason: '취업 스트레스·사회적 고립 등으로 힘든 청년에게 전문 상담을 저렴하게 연결해 드립니다.',
    viewCount: 18900, applicationUrl: 'https://www.mohw.go.kr',
  },
  {
    name: '청년 정신건강 복지서비스', agency: '보건복지부', mainCategory: '정신건강', category: '심리지원',
    description: '정신건강 위기 청년을 대상으로 정신건강 전문의 상담 및 치료 서비스를 무료로 지원합니다.',
    matchReason: '전문적인 정신건강 치료가 필요하지만 비용이 부담스러운 청년을 위한 제도입니다.',
    viewCount: 15600, applicationUrl: 'https://www.mohw.go.kr',
  },
  {
    name: '청년문화예술패스', agency: '문화체육관광부', mainCategory: '문화', category: '문화지원',
    description: '만 19세 청년에게 공연·전시·영화 등 문화예술 활동에 사용할 수 있는 15만원 바우처를 지급합니다.',
    matchReason: '문화생활을 즐기고 싶지만 비용 부담이 있는 청년에게 다양한 문화 경험 기회를 제공합니다.',
    viewCount: 12300, applicationUrl: 'https://www.mcst.go.kr',
  },
  {
    name: '희망두배 청년통장', agency: '서울시', mainCategory: '금융·자산형성', category: '금융지원',
    description: '서울 거주 저소득 청년이 2년간 매월 저축하면 서울시가 동일 금액을 매칭해 최대 2배 적립해 주는 자산형성 지원 사업입니다.',
    matchReason: '소득이 적어 저축이 어려운 청년의 자산 형성 출발점을 만들어주는 서울시 대표 청년 사업입니다.',
    viewCount: 9800, applicationUrl: 'https://www.seoul.go.kr',
  },
];

/** AI 추천 결과에 조회수를 enrichment */
export function enrichWithViewCount(recommendations: Recommendation[]): Recommendation[] {
  return recommendations.map((rec) => {
    const matchedKey = Object.keys(PROGRAM_VIEW_COUNTS).find(
      (key) => rec.name.includes(key) || key.includes(rec.name),
    );
    return {
      ...rec,
      viewCount: matchedKey
        ? PROGRAM_VIEW_COUNTS[matchedKey]
        : Math.floor(Math.random() * 20000) + 5000,
    };
  });
}

/** 개발/테스트용 mock 추천 결과 */
export function getMockRecommendations(): Recommendation[] {
  return [
    {
      name: '청년내일채움공제',
      agency: '고용노동부',
      mainCategory: '취업·창업',
      category: '취업지원',
      description: '중소기업에 취업한 청년이 2년 근속 시 본인 납입금 + 기업·정부 지원금 합산 최대 1,200만원을 적립받는 제도입니다.',
      matchReason: '취업 준비 중인 청년에게 첫 직장 정착과 목돈 마련을 동시에 지원하는 핵심 프로그램입니다.',
      applicationUrl: 'https://www.work.go.kr',
      viewCount: 58420,
    },
    {
      name: '국민취업지원제도',
      agency: '고용노동부',
      mainCategory: '취업·창업',
      category: '취업지원',
      description: '취업 취약계층 청년에게 맞춤형 취업지원서비스와 함께 최대 300만원의 구직촉진수당을 지원합니다.',
      matchReason: '구직 활동 중 생활비 부담을 덜고 체계적인 취업 지원을 받을 수 있습니다.',
      applicationUrl: 'https://www.work24.go.kr',
      viewCount: 47300,
    },
    {
      name: '청년도약계좌',
      agency: '금융위원회',
      mainCategory: '금융·자산형성',
      category: '금융지원',
      description: '매월 40~70만원 납입 시 정부 기여금 + 비과세 혜택으로 5년 만기 최대 5,000만원을 마련할 수 있는 적금입니다.',
      matchReason: '경제적 자립을 원하는 청년의 장기 자산 형성에 최적화된 금융 지원 프로그램입니다.',
      applicationUrl: 'https://www.금융위원회.go.kr',
      viewCount: 41200,
    },
  ];
}

/** 온통청년 API 키 없을 때 사용하는 샘플 프로그램 목록 */
export function getSamplePrograms(): string {
  return [
    '- 청년내일채움공제 (취업지원) | 고용노동부 | 2년 근속 시 최대 1,200만원 적립 | 취업·창업',
    '- 국민취업지원제도 (취업지원) | 고용노동부 | 취업지원서비스 + 최대 300만원 구직촉진수당 | 취업·창업',
    '- 청년창업사관학교 (창업지원) | 중소벤처기업부 | 창업 교육·공간·자금 최대 1억원 | 취업·창업',
    '- 청년도약계좌 (금융지원) | 금융위원회 | 5년 만기 최대 5,000만원 목돈 마련 | 금융·자산형성',
    '- 청년월세 특별지원 (주거지원) | 국토교통부 | 월 최대 20만원, 12개월 지원 | 주거',
    '- 청년마음건강지원사업 (심리지원) | 보건복지부 | 심리상담 바우처 최대 100만원 | 정신건강',
    '- 청년문화예술패스 (문화지원) | 문화체육관광부 | 문화예술 활동비 15만원 지원 | 문화',
    '- 대학생 학자금대출 (교육지원) | 한국장학재단 | 저금리 생활비·등록금 대출 | 교육',
    '- 청년 고용장려금 (취업지원) | 고용노동부 | 중소기업 취업 시 3년간 최대 720만원 지원 | 취업·창업',
    '- 희망두배 청년통장 (금융지원) | 서울시 | 2년 저축 시 최대 2배 적립 | 금융·자산형성',
    '- 청년 정신건강 복지서비스 (심리지원) | 복지부/지자체 | 정신건강 전문의 상담 무료 지원 | 정신건강',
    '- 청년 주거급여 분리지급 (주거지원) | 국토교통부 | 부모와 별도 거주 청년 주거급여 지급 | 주거',
  ].join('\n');
}
