import type { QuizQuestion, QuizAnswers } from './quiz';

/** 현재 질문에 유효한 답변이 있는지 확인 */
export function isAnswered(question: QuizQuestion, answer: QuizAnswers[string]): boolean {
  if (question.skippable) return true;
  if (question.type === 'multi-choice') return Array.isArray(answer) && answer.length > 0;
  if (question.type === 'textarea') return true;
  return answer !== undefined && answer !== null && answer !== '';
}

/** 다중 선택 항목 토글 — 이미 선택된 값이면 제거, 없으면 추가 */
export function toggleMultiChoice(current: string[], value: string): string[] {
  return current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
}
