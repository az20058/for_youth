import type { Application } from './types';
import type { NewApplicationData } from './applicationValidation';

export type ApplicationDTO = Omit<Application, 'deadline'> & { deadline: string | null };

export async function fetchApplications(): Promise<Application[]> {
  const res = await fetch('/api/applications');
  if (!res.ok) throw new Error('지원서 목록을 불러오지 못했습니다.');
  const data: ApplicationDTO[] = await res.json();
  return data.map((app) => ({ ...app, deadline: app.deadline ? new Date(app.deadline) : null }));
}

export async function deleteApplication(id: string): Promise<void> {
  const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('지원서 삭제에 실패했습니다.');
}

export async function postApplication(data: NewApplicationData): Promise<Application> {
  const res = await fetch('/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json();
    throw body;
  }
  const result: ApplicationDTO = await res.json();
  return { ...result, deadline: result.deadline ? new Date(result.deadline) : null };
}
