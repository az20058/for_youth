import { http, HttpResponse } from 'msw';
import { applications, addApplication } from '@/lib/applications';
import type { ApplicationStatus, CompanySize } from '@/lib/types';
import type { NewApplicationData } from '@/lib/applicationValidation';
import type { Recommendation } from '@/lib/quiz';

export const mockRecommendations: Recommendation[] = [
  {
    name: '청년내일채움공제',
    agency: '고용노동부',
    category: '취업지원',
    description: '중소기업에 취업한 청년이 2년 근속 시 최대 1,200만원을 적립받을 수 있는 제도입니다.',
    matchReason: '취업 준비 중인 청년에게 안정적인 첫 직장 정착을 도와주는 프로그램입니다.',
    applicationUrl: 'https://www.work.go.kr',
  },
  {
    name: '국민취업지원제도',
    agency: '고용노동부',
    category: '취업지원',
    description: '취업지원서비스와 함께 최대 300만원의 구직촉진수당을 지원합니다.',
    matchReason: '구직 활동 중인 청년의 생활 안정과 취업 역량 강화를 돕습니다.',
    applicationUrl: 'https://www.work24.go.kr',
  },
];

export const handlers = [
  http.post('/api/recommend', () => {
    return HttpResponse.json({ recommendations: mockRecommendations });
  }),

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
