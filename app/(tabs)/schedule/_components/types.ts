export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  type: 'DEADLINE' | 'CODING_TEST' | 'INTERVIEW' | 'DOCUMENT' | 'OTHER';
  source: 'auto' | 'manual';
  memo?: string | null;
  status?: string;
}

export const EVENT_TYPE_CONFIG: Record<
  ScheduleEvent['type'],
  { label: string; color: string; dot: string }
> = {
  DEADLINE: { label: '지원 마감', color: 'text-red-400', dot: 'bg-red-400' },
  DOCUMENT: { label: '서류 마감', color: 'text-red-400', dot: 'bg-red-400' },
  CODING_TEST: { label: '코딩테스트', color: 'text-blue-400', dot: 'bg-blue-400' },
  INTERVIEW: { label: '면접', color: 'text-purple-400', dot: 'bg-purple-400' },
  OTHER: { label: '기타', color: 'text-gray-400', dot: 'bg-gray-400' },
};
