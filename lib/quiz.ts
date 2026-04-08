export type QuestionType = 'multi-choice' | 'single-choice' | 'select' | 'number' | 'textarea';

export interface QuizOption {
  label: string;
  value: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: QuizOption[];
  placeholder?: string;
  skippable?: boolean;
}

export type QuizAnswers = Record<string, string | string[] | number | null>;

export interface Recommendation {
  id?: string;
  name: string;
  agency: string;
  mainCategory: string;
  category: string;
  description: string;
  matchReason: string;
  supportContent?: string;
  applicationUrl?: string;
  viewCount?: number;
  region?: string;
  zipCodes?: string;
}

/** SIDO 코드 → 지역명 매핑 */
export const SIDO_REGIONS = [
  { code: '11', name: '서울' }, { code: '21', name: '부산' }, { code: '22', name: '대구' },
  { code: '23', name: '인천' }, { code: '24', name: '광주' }, { code: '25', name: '대전' },
  { code: '26', name: '울산' }, { code: '29', name: '세종' }, { code: '31', name: '경기' },
  { code: '32', name: '강원' }, { code: '33', name: '충북' }, { code: '34', name: '충남' },
  { code: '35', name: '전북' }, { code: '36', name: '전남' }, { code: '37', name: '경북' },
  { code: '38', name: '경남' }, { code: '39', name: '제주' },
];

/** @deprecated SIDO_REGIONS 사용 */
export const REGIONS = SIDO_REGIONS.map((r) => r.name);

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'need',
    question: '지금 나에게 가장 필요한 건 뭘까요?',
    type: 'multi-choice',
    options: [
      { label: '"취업이나 창업, 미래 준비!"', value: 'employment' },
      { label: '"요즘 마음이 좀 힘들어요."', value: 'mental' },
      { label: '"혼자 지내다 보니 사회적 연결이 필요해요."', value: 'social' },
      { label: '"경제적 지원이 있으면 좋겠어요."', value: 'financial' },
      { label: '"다른 걸 얘기하고 싶어요!"', value: 'other' },
    ],
  },
  {
    id: 'status',
    question: '현재 어떤 상황인가요?',
    type: 'single-choice',
    options: [
      { label: '취업 준비 중이에요 (취준생)', value: 'job_seeking' },
      { label: '대학교 재학 중이에요', value: 'student' },
      { label: '직장에 다니고 있어요', value: 'employed' },
      { label: '창업을 준비 중이에요', value: 'startup' },
      { label: '딱히 해당되는 게 없어요', value: 'none' },
    ],
  },
  {
    id: 'region',
    question: '나의 거주 지역은',
    type: 'select',
    options: SIDO_REGIONS.map((r) => ({ label: r.name, value: r.code })),
  },
  {
    id: 'age',
    question: '나이가 어떻게 되시나요?',
    type: 'number',
    placeholder: '나이를 입력하세요 (예: 25)',
  },
  {
    id: 'income',
    question: '가구 소득 상황은 어떤가요?',
    type: 'single-choice',
    options: [
      { label: '기초생활수급자예요', value: 'basic_welfare' },
      { label: '차상위계층이에요', value: 'near_poverty' },
      { label: '중위소득 이하인 것 같아요', value: 'below_median' },
      { label: '일반 가정이에요', value: 'general' },
    ],
    skippable: true,
  },
  {
    id: 'freetext',
    question: '추가로 하고 싶은 말이 있으신가요?',
    type: 'textarea',
    placeholder: '현재 상황이나 고민을 자유롭게 적어주세요.\nAI가 더 잘 맞는 프로그램을 찾아드려요.',
    skippable: true,
  },
];
