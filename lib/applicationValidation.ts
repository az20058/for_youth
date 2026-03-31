import type { ApplicationStatus, CompanySize, CoverLetterType } from './types';

export const COMPANY_SIZES: CompanySize[] = ['대기업', '중견기업', '중소기업', '스타트업'];
export const APPLICATION_STATUSES: ApplicationStatus[] = [
  '지원 예정',
  '코테 기간',
  '면접 기간',
  '지원 완료',
  '서류 탈락',
  '코테 탈락',
  '면접 탈락',
  '최종 합격',
];

export interface CoverLetterDraft {
  id: string;
  question: string;
  answer: string;
  type: CoverLetterType | null;
}

export interface NewApplicationData {
  companyName: string;
  careerLevel: string;
  deadline: string; // YYYY-MM-DD
  companySize: string;
  status: string;
  coverLetters: CoverLetterDraft[];
}

export interface FormErrors {
  companyName?: string;
  careerLevel?: string;
  deadline?: string;
  companySize?: string;
  status?: string;
  coverLetters?: string;
}

export function validateApplication(data: NewApplicationData): FormErrors {
  const errors: FormErrors = {};

  if (!data.companyName.trim()) {
    errors.companyName = '회사명을 입력해주세요.';
  }

  if (!data.careerLevel.trim()) {
    errors.careerLevel = '경력을 입력해주세요.';
  }

  if (!data.deadline) {
    errors.deadline = '마감일을 입력해주세요.';
  } else {
    const deadlineDate = new Date(data.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadlineDate < today) {
      errors.deadline = '마감일은 오늘 이후여야 합니다.';
    }
  }

  if (!COMPANY_SIZES.includes(data.companySize as CompanySize)) {
    errors.companySize = '기업 규모를 선택해주세요.';
  }

  if (!APPLICATION_STATUSES.includes(data.status as ApplicationStatus)) {
    errors.status = '상태를 선택해주세요.';
  }

  const hasInvalidCoverLetter = data.coverLetters.some((cl) => !cl.question.trim());
  if (hasInvalidCoverLetter) {
    errors.coverLetters = '자기소개서 항목에 질문을 입력해주세요.';
  }

  return errors;
}
