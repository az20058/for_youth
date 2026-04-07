import { prisma } from '@/lib/db';
import { validateApplication, type NewApplicationData } from '@/lib/applicationValidation';
import {
  STATUS_FROM_DB,
  STATUS_TO_DB,
  SIZE_FROM_DB,
  SIZE_TO_DB,
  COVER_LETTER_TYPE_FROM_DB,
  COVER_LETTER_TYPE_TO_DB,
} from '@/lib/enumMaps';
import type { CoverLetterType } from '@/lib/types';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const apps = await prisma.application.findMany({
    where: { userId },
    include: { coverLetters: true },
    orderBy: { createdAt: 'desc' },
  });

  return Response.json(
    apps.map((app) => ({
      id: app.id,
      companyName: app.companyName,
      careerLevel: app.careerLevel,
      deadline: app.deadline?.toISOString() ?? null,
      companySize: SIZE_FROM_DB[app.companySize],
      status: STATUS_FROM_DB[app.status],
      url: app.url ?? undefined,
      coverLetters: app.coverLetters.map((cl) => ({
        id: cl.id,
        question: cl.question,
        answer: cl.answer,
        type: cl.type ? COVER_LETTER_TYPE_FROM_DB[cl.type] : null,
      })),
    })),
  );
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const data: NewApplicationData = await request.json();

  const errors = validateApplication(data);
  if (Object.keys(errors).length > 0) {
    return Response.json({ errors }, { status: 400 });
  }

  const app = await prisma.application.create({
    data: {
      companyName: data.companyName,
      careerLevel: data.careerLevel,
      deadline: data.deadline ? new Date(data.deadline) : null,
      companySize: SIZE_TO_DB[data.companySize as keyof typeof SIZE_TO_DB],
      status: STATUS_TO_DB[data.status as keyof typeof STATUS_TO_DB],
      url: data.url || null,
      userId,
      coverLetters: {
        createMany: {
          data: data.coverLetters.map((cl) => ({
            question: cl.question,
            answer: cl.answer,
            type: cl.type ? COVER_LETTER_TYPE_TO_DB[cl.type as CoverLetterType] : null,
          })),
        },
      },
    },
    include: { coverLetters: true },
  });

  return Response.json(
    {
      id: app.id,
      companyName: app.companyName,
      careerLevel: app.careerLevel,
      deadline: app.deadline?.toISOString() ?? null,
      companySize: SIZE_FROM_DB[app.companySize],
      status: STATUS_FROM_DB[app.status],
      url: app.url ?? undefined,
      coverLetters: app.coverLetters.map((cl) => ({
        id: cl.id,
        question: cl.question,
        answer: cl.answer,
        type: cl.type ? COVER_LETTER_TYPE_FROM_DB[cl.type] : null,
      })),
    },
    { status: 201 },
  );
}
