import { getApplications, addApplication } from '@/lib/applications';
import { validateApplication, type NewApplicationData } from '@/lib/applicationValidation';
import type { ApplicationStatus, CompanySize } from '@/lib/types';

export function GET() {
  const apps = getApplications();
  return Response.json(
    apps.map((app) => ({ ...app, deadline: app.deadline.toISOString() })),
  );
}

export async function POST(request: Request) {
  const data: NewApplicationData = await request.json();
  const errors = validateApplication(data);
  if (Object.keys(errors).length > 0) {
    return Response.json({ errors }, { status: 400 });
  }
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
  return Response.json(
    { ...newApp, deadline: newApp.deadline.toISOString() },
    { status: 201 },
  );
}
