'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  deadline: Date | undefined;
  companySize: string;
  status: string;
  coverLetters: CoverLetterDraft[];
}

const INITIAL_FORM: FormState = {
  companyName: '',
  careerLevel: '',
  deadline: undefined,
  companySize: '',
  status: '지원 예정',
  coverLetters: [],
};

const inputClass =
  'w-full rounded-lg bg-muted/50 px-3 py-2 text-sm ring-1 ring-foreground/10 focus:outline-none focus:ring-primary';

export function NewApplicationForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: NewApplicationData = {
      ...form,
      deadline: form.deadline ? format(form.deadline, 'yyyy-MM-dd') : '',
    };
    const validationErrors = validateApplication(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsSubmitting(true);
    try {
      await createApplication(data);
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

  return (
    <form onSubmit={handleSubmit} className="mb-8 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* 회사명 */}
        <div className="flex flex-col gap-1.5">
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

        {/* 경력 */}
        <div className="flex flex-col gap-1.5">
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

        {/* 마감일 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">마감일</label>
          <DatePicker
            value={form.deadline}
            onChange={(date) => setForm((prev) => ({ ...prev, deadline: date }))}
            placeholder="마감일 선택"
            disablePast
          />
          {errors.deadline && (
            <p className="text-xs text-destructive">{errors.deadline}</p>
          )}
        </div>

        {/* 기업 규모 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">기업 규모</label>
          <Select
            value={form.companySize}
            onValueChange={(value) => setForm((prev) => ({ ...prev, companySize: value }))}
          >
            <SelectTrigger className="w-full h-9" aria-label="기업 규모 선택">
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.companySize && (
            <p className="text-xs text-destructive">{errors.companySize}</p>
          )}
        </div>

        {/* 지원 상태 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">지원 상태</label>
          <Select
            value={form.status}
            onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="w-full h-9" aria-label="지원 상태 선택">
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {APPLICATION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="text-xs text-destructive">{errors.status}</p>
          )}
        </div>
      </div>

      {/* 자기소개서 항목 */}
      {form.coverLetters.length > 0 && (
        <div className="mt-5 flex flex-col gap-3">
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

      <div className="mt-5 flex gap-2">
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
