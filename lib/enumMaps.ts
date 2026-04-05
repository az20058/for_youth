import {
  ApplicationStatus as DbStatus,
  CompanySize as DbSize,
  CoverLetterType as DbType,
} from './generated/prisma/client';
import type { ApplicationStatus, CompanySize, CoverLetterType } from './types';

export const STATUS_TO_DB: Record<ApplicationStatus, DbStatus> = {
  '지원 예정': DbStatus.PENDING,
  '코테 기간': DbStatus.CODING_TEST,
  '면접 기간': DbStatus.INTERVIEW,
  '지원 완료': DbStatus.APPLIED,
  '최종 합격': DbStatus.ACCEPTED,
  '서류 탈락': DbStatus.REJECTED_DOCS,
  '코테 탈락': DbStatus.REJECTED_CODING,
  '면접 탈락': DbStatus.REJECTED_INTERVIEW,
};

export const STATUS_FROM_DB: Record<DbStatus, ApplicationStatus> = {
  PENDING: '지원 예정',
  CODING_TEST: '코테 기간',
  INTERVIEW: '면접 기간',
  APPLIED: '지원 완료',
  ACCEPTED: '최종 합격',
  REJECTED_DOCS: '서류 탈락',
  REJECTED_CODING: '코테 탈락',
  REJECTED_INTERVIEW: '면접 탈락',
};

export const SIZE_TO_DB: Record<CompanySize, DbSize> = {
  '대기업': DbSize.LARGE,
  '중견기업': DbSize.MID_LARGE,
  '중소기업': DbSize.MID,
  '스타트업': DbSize.STARTUP,
};

export const SIZE_FROM_DB: Record<DbSize, CompanySize> = {
  LARGE: '대기업',
  MID_LARGE: '중견기업',
  MID: '중소기업',
  STARTUP: '스타트업',
};

export const COVER_LETTER_TYPE_TO_DB: Record<CoverLetterType, DbType> = {
  '지원 동기': DbType.MOTIVATION,
  '성장 과정': DbType.GROWTH,
  '직무 역량': DbType.JOB_SKILLS,
  '성격 장단점': DbType.PERSONALITY,
  '성공 경험': DbType.SUCCESS,
  '실패 경험': DbType.FAILURE,
  '팀워크 경험': DbType.TEAMWORK,
  '입사 후 포부': DbType.FUTURE_GOALS,
  '기타': DbType.OTHER,
};

export const COVER_LETTER_TYPE_FROM_DB: Record<DbType, CoverLetterType> = {
  MOTIVATION: '지원 동기',
  GROWTH: '성장 과정',
  JOB_SKILLS: '직무 역량',
  PERSONALITY: '성격 장단점',
  SUCCESS: '성공 경험',
  FAILURE: '실패 경험',
  TEAMWORK: '팀워크 경험',
  FUTURE_GOALS: '입사 후 포부',
  OTHER: '기타',
};
