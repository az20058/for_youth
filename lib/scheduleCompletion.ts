import type { ApplicationStatus, ScheduleEventType } from './generated/prisma/enums';

export interface EventInput {
  completedAt: Date | null;
  type: ScheduleEventType;
}
export interface AppInput {
  status: ApplicationStatus;
}

export function isEventCompleted(event: EventInput, app: AppInput | null): boolean {
  if (event.completedAt) return true;
  if (!app) return false;
  if (event.type === 'OTHER') return false;
  const s = app.status;
  if (s === 'REJECTED_DOCS' || s === 'REJECTED_CODING' || s === 'REJECTED_INTERVIEW') return true;
  if (event.type === 'CODING_TEST') return s === 'INTERVIEW' || s === 'APPLIED' || s === 'ACCEPTED';
  if (event.type === 'INTERVIEW') return s === 'APPLIED' || s === 'ACCEPTED';
  if (event.type === 'DOCUMENT') return s !== 'PENDING';
  return false;
}
