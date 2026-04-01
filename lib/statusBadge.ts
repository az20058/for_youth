import type { ApplicationStatus } from './types';

export function statusBadgeClass(status: ApplicationStatus): string {
  switch (status) {
    case '지원 예정':
      return 'border-transparent bg-zinc-500/20 text-zinc-400';
    case '코테 기간':
      return 'border-transparent bg-amber-500/15 text-amber-400';
    case '면접 기간':
      return 'border-transparent bg-violet-500/15 text-violet-400';
    case '지원 완료':
      return 'border-transparent bg-sky-500/15 text-sky-400';
    case '최종 합격':
      return 'border-transparent bg-emerald-500/15 text-emerald-400';
    case '서류 탈락':
    case '코테 탈락':
    case '면접 탈락':
      return 'border-transparent bg-zinc-500/10 text-zinc-500';
  }
}
