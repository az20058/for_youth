import { put } from '@vercel/blob';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get('file') as File | null;
  if (!file) {
    return Response.json({ message: '파일이 없습니다.' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() ?? 'pdf';
  const blob = await put(`users/${userId}/${Date.now()}.${ext}`, file, { access: 'public' });
  return Response.json({ url: blob.url });
}
