import { put } from '@vercel/blob';
import { getAuthenticatedUserId } from '@/lib/auth';

const ALLOWED_MIME_TYPES = ['application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return Response.json({ message: 'PDF 파일만 업로드할 수 있습니다.' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ message: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 });
  }

  // magic bytes 검증: 실제 PDF 파일인지 바이너리 헤더 확인
  const headerBytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const pdfMagic = [0x25, 0x50, 0x44, 0x46, 0x2D]; // %PDF-
  if (headerBytes.length < 5 || !pdfMagic.every((b, i) => headerBytes[i] === b)) {
    return Response.json({ message: '유효한 PDF 파일이 아닙니다.' }, { status: 400 });
  }

  const blob = await put(`users/${userId}/${Date.now()}.pdf`, file, {
    access: 'public',
    contentType: 'application/pdf',
  });
  return Response.json({ url: blob.url });
}
