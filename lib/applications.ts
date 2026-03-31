import type { Application, ApplicationStatus, CompanySize, CoverLetterQA } from './types';

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export const applications: Application[] = [
  {
    id: '1',
    companyName: '네이버',
    careerLevel: '신입',
    deadline: daysFromNow(19),
    companySize: '대기업',
    coverLetters: [
      {
        id: 'cl-1',
        question: '지원 동기를 작성해주세요.',
        answer: '저는 귀사의 기술력과 서비스 철학에 깊은 인상을 받아 지원하게 되었습니다.',
        type: '지원 동기',
      },
      {
        id: 'cl-2',
        question: '본인의 강점과 약점을 서술해주세요.',
        answer: '',
        type: '성격 장단점',
      },
    ],
    status: '지원 예정',
  },
  {
    id: '2',
    companyName: '카카오',
    careerLevel: '경력 3년',
    deadline: daysFromNow(24),
    companySize: '대기업',
    coverLetters: [],
    status: '코테 기간',
  },
  {
    id: '3',
    companyName: '토스',
    careerLevel: '경력 2년',
    deadline: daysFromNow(14),
    companySize: '스타트업',
    coverLetters: [],
    status: '면접 기간',
  },
  {
    id: '4',
    companyName: '쿠팡',
    careerLevel: '신입',
    deadline: daysFromNow(29),
    companySize: '대기업',
    coverLetters: [],
    status: '지원 완료',
  },
  {
    id: '5',
    companyName: '배달의민족',
    careerLevel: '경력 1년',
    deadline: daysFromNow(22),
    companySize: '중견기업',
    coverLetters: [],
    status: '서류 탈락',
  },
  {
    id: '6',
    companyName: '라인',
    careerLevel: '신입',
    deadline: daysFromNow(9),
    companySize: '대기업',
    coverLetters: [],
    status: '코테 탈락',
  },
];

export function getApplications(): Application[] {
  return applications;
}

export function getApplicationById(id: string): Application | undefined {
  return applications.find((app) => app.id === id);
}

export function addApplication(data: {
  companyName: string;
  careerLevel: string;
  deadline: Date;
  companySize: CompanySize;
  status: ApplicationStatus;
  coverLetters: CoverLetterQA[];
}): Application {
  const newApp: Application = {
    id: String(Date.now()),
    ...data,
  };
  applications.push(newApp);
  return newApp;
}
