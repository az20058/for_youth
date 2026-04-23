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
  | '성공 경험'
  | '실패 경험'
  | '팀워크 경험'
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
  deadline: Date | null;
  companySize: CompanySize;
  coverLetters: CoverLetterQA[];
  status: ApplicationStatus;
  url?: string;
}

export interface CoverLetterWithApplication {
  coverLetterId: string;
  question: string;
  answer: string;
  type: CoverLetterType | null;
  applicationId: string;
  companyName: string;
}

export interface CertItem {
  name: string;
  issuer: string;
  date: string;
  number: string;
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  school: string | null;
  major: string | null;
  careerLevel: string | null;
  portfolioUrl: string | null;
  resumeUrl: string | null;
  certifications: CertItem[];
  languages: CertItem[];
  techStacks: string[];
}

export type NotificationType = '마감 임박' | '일정 알림' | '상태 변경';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedId: string | null;
  createdAt: string;
}
