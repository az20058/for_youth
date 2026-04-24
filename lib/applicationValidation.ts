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
  url?: string;
}

export interface FormErrors {
  companyName?: string;
  careerLevel?: string;
  deadline?: string;
  companySize?: string;
  status?: string;
  coverLetters?: string;
  url?: string;
}

export function validateApplication(data: NewApplicationData): FormErrors {
  const errors: FormErrors = {};

  if (!data.companyName.trim()) {
    errors.companyName = '회사명을 입력해주세요.';
  }

  if (!data.careerLevel.trim()) {
    errors.careerLevel = '경력을 입력해주세요.';
  }

  if (data.deadline) {
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

  if (data.companyName.length > 100) {
    errors.companyName = '회사명은 100자 이하여야 합니다.';
  }

  if (data.careerLevel.length > 50) {
    errors.careerLevel = '경력은 50자 이하여야 합니다.';
  }

  const hasInvalidCoverLetter = data.coverLetters.some((cl) => !cl.question.trim());
  if (hasInvalidCoverLetter) {
    errors.coverLetters = '자기소개서 항목에 질문을 입력해주세요.';
  }

  if (data.coverLetters.length > 20) {
    errors.coverLetters = '자기소개서는 최대 20개까지 추가할 수 있습니다.';
  }

  if (data.coverLetters.some((cl) => cl.question.length > 500 || cl.answer.length > 10_000)) {
    errors.coverLetters = '자기소개서 질문은 500자, 답변은 10,000자 이하여야 합니다.';
  }

  if (data.url) {
    try {
      const parsed = new URL(data.url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        errors.url = '유효한 URL을 입력해주세요. (http 또는 https)';
      }
    } catch {
      errors.url = '유효한 URL을 입력해주세요.';
    }
  }

  return errors;
}
