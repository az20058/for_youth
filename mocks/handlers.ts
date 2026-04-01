import { http, HttpResponse } from 'msw';
import { applications, addApplication } from '@/lib/applications';
import type { ApplicationStatus, CompanySize } from '@/lib/types';
import type { NewApplicationData } from '@/lib/applicationValidation';

export const handlers = [
  http.get('/api/applications', () => {
    return HttpResponse.json(
      applications.map((app) => ({ ...app, deadline: app.deadline.toISOString() })),
    );
  }),

  http.get('/api/applications/:id', ({ params }) => {
    const app = applications.find((a) => a.id === params.id);
    if (!app) {
      return HttpResponse.json({ message: '지원서를 찾을 수 없습니다.' }, { status: 404 });
    }
    return HttpResponse.json({ ...app, deadline: app.deadline.toISOString() });
  }),

  http.post('/api/applications', async ({ request }) => {
    const data = (await request.json()) as NewApplicationData;
    const newApp = addApplication({
      companyName: data.companyName,
      careerLevel: data.careerLevel,
      deadline: new Date(data.deadline),
      companySize: data.companySize as CompanySize,
      status: data.status as ApplicationStatus,
      coverLetters: data.coverLetters.map((cl, i) => ({
        id: cl.id || `cl-${Date.now()}-${i}`,
        question: cl.question,
        answer: cl.answer,
        type: cl.type,
      })),
      url: data.url || undefined,
    });
    return HttpResponse.json(
      { ...newApp, deadline: newApp.deadline.toISOString() },
      { status: 201 },
    );
  }),
];
