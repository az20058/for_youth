import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, image: true,
      bio: true, school: true, major: true, careerLevel: true,
      portfolioUrl: true, resumeUrl: true, certifications: true, techStacks: true,
    },
  });

  if (!user) {
    return Response.json({ message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  return Response.json({
    ...user,
    certifications: (user.certifications as string[]) ?? [],
    techStacks: (user.techStacks as string[]) ?? [],
  });
}

const ALLOWED_FIELDS = [
  'bio', 'school', 'major', 'careerLevel', 'portfolioUrl', 'resumeUrl',
  'certifications', 'techStacks',
] as const;

export async function PATCH(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json();

  const data: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      data[field] = body[field];
    }
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ message: '수정할 항목이 없습니다.' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true, name: true, email: true, image: true,
      bio: true, school: true, major: true, careerLevel: true,
      portfolioUrl: true, resumeUrl: true, certifications: true, techStacks: true,
    },
  });

  return Response.json({
    ...user,
    certifications: (user.certifications as string[]) ?? [],
    techStacks: (user.techStacks as string[]) ?? [],
  });
}
