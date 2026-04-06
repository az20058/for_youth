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
  name: string;
  agency: string;
  mainCategory: string;
  category: string;
  description: string;
  matchReason: string;
  applicationUrl?: string;
  viewCount?: number;
}

export const REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

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
    options: REGIONS.map((r) => ({ label: r, value: r })),
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
