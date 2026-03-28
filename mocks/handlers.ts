import { http, HttpResponse } from 'msw';
import { applications } from '@/lib/applications';

export const handlers = [
  http.get('/api/applications', () => {
    return HttpResponse.json(applications);
  }),

  http.get('/api/applications/:id', ({ params }) => {
    const app = applications.find((a) => a.id === params.id);
    if (!app) {
      return HttpResponse.json({ message: '지원서를 찾을 수 없습니다.' }, { status: 404 });
    }
    return HttpResponse.json(app);
  }),
];
