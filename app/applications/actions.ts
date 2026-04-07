'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';
import { validateApplication, type NewApplicationData, type FormErrors } from '@/lib/applicationValidation';
import { STATUS_TO_DB, SIZE_TO_DB, COVER_LETTER_TYPE_TO_DB } from '@/lib/enumMaps';
import type { ApplicationStatus, CompanySize, CoverLetterType } from '@/lib/types';

export async function createApplication(
  data: NewApplicationData,
): Promise<{ errors?: FormErrors }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) redirect('/login');

  const errors = validateApplication(data);
  if (Object.keys(errors).length > 0) return { errors };

  await prisma.application.create({
    data: {
      companyName: data.companyName,
      careerLevel: data.careerLevel,
      deadline: data.deadline ? new Date(data.deadline) : null,
      companySize: SIZE_TO_DB[data.companySize as CompanySize],
      status: STATUS_TO_DB[data.status as ApplicationStatus],
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
  });

  revalidatePath('/applications');
  return {};
}
