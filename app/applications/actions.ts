'use server';

import { revalidatePath } from 'next/cache';
import { addApplication } from '@/lib/applications';
import {
  validateApplication,
  type NewApplicationData,
  type FormErrors,
} from '@/lib/applicationValidation';
import type { ApplicationStatus, CompanySize } from '@/lib/types';

export async function createApplication(
  data: NewApplicationData,
): Promise<{ errors?: FormErrors }> {
  const errors = validateApplication(data);
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  addApplication({
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
  });

  revalidatePath('/applications');
  return {};
}
