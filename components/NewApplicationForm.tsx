'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createApplication } from '@/app/applications/actions';
import {
  validateApplication,
  COMPANY_SIZES,
  APPLICATION_STATUSES,
  type FormErrors,
  type CoverLetterDraft,
  type NewApplicationData,
} from '@/lib/applicationValidation';

interface FormState {
  companyName: string;
  careerLevel: string;
  deadline: string;
  companySize: string;
  status: string;
  coverLetters: CoverLetterDraft[];
}

const INITIAL_FORM: FormState = {
  companyName: '',
  careerLevel: '',
  deadline: '',
  companySize: '',
  status: '지원 예정',
  coverLetters: [],
};

export function NewApplicationForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateApplication(form as NewApplicationData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsSubmitting(true);
    try {
      await createApplication(form as NewApplicationData);
      router.push('/applications');
    } finally {
      setIsSubmitting(false);
    }
  }

  function addCoverLetter() {
    setForm((prev) => ({
      ...prev,
      coverLetters: [
        ...prev.coverLetters,
        { id: `cl-${Date.now()}`, question: '', answer: '', type: null },
      ],
    }));
  }

  function updateCoverLetter(id: string, field: 'question' | 'answer', value: string) {
    setForm((prev) => ({
      ...prev,
      coverLetters: prev.coverLetters.map((cl) =>
        cl.id === id ? { ...cl, [field]: value } : cl,
      ),
    }));
  }

  function removeCoverLetter(id: string) {
    setForm((prev) => ({
      ...prev,
      coverLetters: prev.coverLetters.filter((cl) => cl.id !== id),
    }));
  }

  const inputClass =
    'rounded-lg bg-muted/50 px-3 py-2 text-sm ring-1 ring-foreground/10 focus:outline-none focus:ring-primary';

  return (
    <form onSubmit={handleSubmit} className="mb-8 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">새 지원서 추가</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="companyName" className="text-xs text-muted-foreground">
            회사명
          </label>
          <input
            id="companyName"
            className={inputClass}
            value={form.companyName}
            onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
            placeholder="회사명"
          />
          {errors.companyName && (
            <p className="text-xs text-destructive">{errors.companyName}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="careerLevel" className="text-xs text-muted-foreground">
            경력
          </label>
          <input
            id="careerLevel"
            className={inputClass}
            value={form.careerLevel}
            onChange={(e) => setForm((prev) => ({ ...prev, careerLevel: e.target.value }))}
            placeholder="신입 / 경력 N년"
          />
          {errors.careerLevel && (
            <p className="text-xs text-destructive">{errors.careerLevel}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="deadline" className="text-xs text-muted-foreground">
            마감일
          </label>
          <input
            id="deadline"
            type="date"
            className={inputClass}
            value={form.deadline}
            onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
          />
          {errors.deadline && (
            <p className="text-xs text-destructive">{errors.deadline}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="companySize" className="text-xs text-muted-foreground">
            기업 규모
          </label>
          <select
            id="companySize"
            className={inputClass}
            value={form.companySize}
            onChange={(e) => setForm((prev) => ({ ...prev, companySize: e.target.value }))}
          >
            <option value="">선택</option>
            {COMPANY_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.companySize && (
            <p className="text-xs text-destructive">{errors.companySize}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs text-muted-foreground">
            상태
          </label>
          <select
            id="status"
            className={inputClass}
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className="text-xs text-destructive">{errors.status}</p>
          )}
        </div>
      </div>

      {form.coverLetters.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {errors.coverLetters && (
            <p className="text-xs text-destructive">{errors.coverLetters}</p>
          )}
          {form.coverLetters.map((cl, idx) => (
            <div key={cl.id} className="flex flex-col gap-2 rounded-xl bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">자기소개서 {idx + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`자기소개서 ${idx + 1} 삭제`}
                  onClick={() => removeCoverLetter(cl.id)}
                >
                  <Trash2Icon className="size-4 text-muted-foreground" />
                </Button>
              </div>
              <input
                aria-label={`자기소개서 ${idx + 1} 질문`}
                className={inputClass}
                value={cl.question}
                onChange={(e) => updateCoverLetter(cl.id, 'question', e.target.value)}
                placeholder="질문"
              />
              <textarea
                aria-label={`자기소개서 ${idx + 1} 답변`}
                className={`min-h-20 resize-none ${inputClass}`}
                value={cl.answer}
                onChange={(e) => updateCoverLetter(cl.id, 'answer', e.target.value)}
                placeholder="답변 (선택)"
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Button type="button" variant="outline" className="gap-1.5" onClick={addCoverLetter}>
          <PlusIcon />
          질문 추가
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '저장 중...' : '저장'}
        </Button>
      </div>
    </form>
  );
}
