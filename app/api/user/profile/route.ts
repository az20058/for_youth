import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';
import type { CertItem } from '@/lib/types';

function normalizeCerts(raw: unknown): CertItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c: unknown) =>
    typeof c === 'string'
      ? { name: c, issuer: '', date: '', number: '' }
      : (c as CertItem)
  );
}

const SELECT = {
  id: true, name: true, email: true, image: true,
  bio: true, school: true, major: true, careerLevel: true,
  portfolioUrl: true, resumeUrl: true,
  education: true, careers: true,
  certifications: true, languages: true, techStacks: true,
} as const;

function formatUser(user: Record<string, unknown>) {
  return {
    ...user,
    education: user.education ?? null,
    careers: Array.isArray(user.careers) ? user.careers : [],
    certifications: normalizeCerts(user.certifications),
    languages: normalizeCerts(user.languages),
    techStacks: (user.techStacks as string[]) ?? [],
  };
}

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: SELECT });
  if (!user) {
    return Response.json({ message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  return Response.json(formatUser(user as Record<string, unknown>));
}

const ALLOWED_FIELDS = [
  'bio', 'school', 'major', 'careerLevel', 'portfolioUrl', 'resumeUrl',
  'education', 'careers', 'certifications', 'languages', 'techStacks',
] as const;

export async function PATCH(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json();

  const data: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in body) data[field] = body[field];
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ message: '수정할 항목이 없습니다.' }, { status: 400 });
  }

  const user = await prisma.user.update({ where: { id: userId }, data, select: SELECT });
  return Response.json(formatUser(user as Record<string, unknown>));
}
