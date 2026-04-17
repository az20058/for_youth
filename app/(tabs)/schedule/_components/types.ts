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
  { label: string; color: string; dot: string; bar: string }
> = {
  DEADLINE: {
    label: '지원 마감',
    color: 'text-red-400',
    dot: 'bg-red-400',
    bar: 'bg-primary/15 text-primary',
  },
  DOCUMENT: {
    label: '서류 마감',
    color: 'text-red-400',
    dot: 'bg-red-400',
    bar: 'bg-primary/15 text-primary',
  },
  CODING_TEST: {
    label: '코딩테스트',
    color: 'text-blue-400',
    dot: 'bg-blue-400',
    bar: 'bg-blue-500/15 text-blue-300',
  },
  INTERVIEW: {
    label: '면접',
    color: 'text-purple-400',
    dot: 'bg-purple-400',
    bar: 'bg-purple-500/15 text-purple-300',
  },
  OTHER: {
    label: '기타',
    color: 'text-gray-400',
    dot: 'bg-gray-400',
    bar: 'bg-muted text-muted-foreground',
  },
};
