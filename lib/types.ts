export type ApplicationStatus =
  | '지원 예정'
  | '코테 기간'
  | '면접 기간'
  | '지원 완료'
  | '서류 탈락'
  | '코테 탈락'
  | '면접 탈락'
  | '최종 합격';

export type CompanySize = '대기업' | '중견기업' | '중소기업' | '스타트업';

export type CoverLetterType =
  | '지원 동기'
  | '성장 과정'
  | '직무 역량'
  | '성격 장단점'
  | '입사 후 포부'
  | '기타';

export interface CoverLetterQA {
  id: string;
  question: string;
  answer: string;
  type?: CoverLetterType | null;
}

export interface Application {
  id: string;
  companyName: string;
  careerLevel: string;
  deadline: Date;
  companySize: CompanySize;
  coverLetters: CoverLetterQA[];
  status: ApplicationStatus;
}

export interface CoverLetterWithApplication {
  coverLetterId: string;
  question: string;
  answer: string;
  type: CoverLetterType | null;
  applicationId: string;
  companyName: string;
}
