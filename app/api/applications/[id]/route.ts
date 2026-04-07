import { prisma } from '@/lib/db';
import {
  STATUS_FROM_DB,
  STATUS_TO_DB,
  SIZE_FROM_DB,
  SIZE_TO_DB,
  COVER_LETTER_TYPE_FROM_DB,
  COVER_LETTER_TYPE_TO_DB,
} from '@/lib/enumMaps';
import type { ApplicationStatus, CompanySize, CoverLetterType } from '@/lib/types';
import { getAuthenticatedUserId } from '@/lib/auth';

function serializeApp(app: Awaited<ReturnType<typeof findApp>>) {
  if (!app) return null;
  return {
    id: app.id,
    companyName: app.companyName,
    careerLevel: app.careerLevel,
    deadline: app.deadline.toISOString(),
    companySize: SIZE_FROM_DB[app.companySize],
    status: STATUS_FROM_DB[app.status],
    url: app.url ?? undefined,
    coverLetters: app.coverLetters.map((cl) => ({
      id: cl.id,
      question: cl.question,
      answer: cl.answer,
      type: cl.type ? COVER_LETTER_TYPE_FROM_DB[cl.type] : null,
    })),
  };
}

function findApp(id: string, userId: string) {
  return prisma.application.findFirst({
    where: { id, userId },
    include: { coverLetters: true },
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });

  const { id } = await params;
  const app = await findApp(id, userId);
  if (!app) return Response.json({ message: '지원서를 찾을 수 없습니다.' }, { status: 404 });
  return Response.json(serializeApp(app));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });

  const { id } = await params;
  const body = await request.json() as {
    status?: ApplicationStatus;
    companySize?: CompanySize;
    companyName?: string;
    careerLevel?: string;
    deadline?: string;
    url?: string | null;
    coverLetters?: Array<{ id?: string; question: string; answer: string; type: CoverLetterType | null }>;
  };

  const app = await findApp(id, userId);
  if (!app) return Response.json({ message: '지원서를 찾을 수 없습니다.' }, { status: 404 });

  const updated = await prisma.application.update({
    where: { id },
    data: {
      ...(body.companyName !== undefined && { companyName: body.companyName }),
      ...(body.careerLevel !== undefined && { careerLevel: body.careerLevel }),
      ...(body.deadline !== undefined && { deadline: new Date(body.deadline) }),
      ...(body.companySize !== undefined && { companySize: SIZE_TO_DB[body.companySize] }),
      ...(body.status !== undefined && { status: STATUS_TO_DB[body.status] }),
      ...(body.url !== undefined && { url: body.url }),
      ...(body.coverLetters !== undefined && {
        coverLetters: {
          deleteMany: {},
          createMany: {
            data: body.coverLetters.map((cl) => ({
              question: cl.question,
              answer: cl.answer,
              type: cl.type ? COVER_LETTER_TYPE_TO_DB[cl.type] : null,
            })),
          },
        },
      }),
    },
    include: { coverLetters: true },
  });

  return Response.json(serializeApp(updated));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });

  const { id } = await params;
  const app = await findApp(id, userId);
  if (!app) return Response.json({ message: '지원서를 찾을 수 없습니다.' }, { status: 404 });
  await prisma.application.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
