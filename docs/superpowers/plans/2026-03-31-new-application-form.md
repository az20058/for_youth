# New Application Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/applications` 목록 페이지 상단에 인라인 폼을 추가해 새 지원서를 생성한다.

**Architecture:** Client Component 폼 → 클라이언트 유효성 검사 → Server Action → in-memory 배열 추가 → `revalidatePath`로 목록 갱신. 유효성 검사는 순수 함수로 분리해 단위 테스트 가능하게 한다.

**Tech Stack:** Next.js 16 App Router, React 19, Server Actions, React Testing Library, Jest

---

## File Map

| 파일 | 변경 |
|---|---|
| `lib/applicationValidation.ts` | 신규 — 유효성 검사 순수 함수 |
| `lib/applications.ts` | 수정 — `addApplication()` 추가 |
| `app/applications/actions.ts` | 신규 — Server Action |
| `components/NewApplicationForm.tsx` | 신규 — Client Component 인라인 폼 |
| `app/applications/page.tsx` | 수정 — `NewApplicationForm` 렌더링 |
| `__tests__/applications/applicationValidation.test.ts` | 신규 |
| `__tests__/applications/NewApplicationForm.test.tsx` | 신규 |

---

### Task 1: 유효성 검사 — 테스트 작성 후 구현

**Files:**
- Create: `lib/applicationValidation.ts`
- Create: `__tests__/applications/applicationValidation.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

`__tests__/applications/applicationValidation.test.ts` 생성:

```typescript
import { validateApplication } from '@/lib/applicationValidation';

const tomorrow = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
})();

const validData = {
  companyName: '네이버',
  careerLevel: '신입',
  deadline: tomorrow,
  companySize: '대기업',
  status: '지원 예정',
  coverLetters: [] as { id: string; question: string; answer: string; type: null }[],
};

describe('validateApplication', () => {
  it('유효한 데이터 → 에러 없음', () => {
    expect(validateApplication(validData)).toEqual({});
  });

  it('companyName 빈 문자열 → companyName 에러', () => {
    const result = validateApplication({ ...validData, companyName: '' });
    expect(result.companyName).toBeDefined();
  });

  it('companyName 공백만 → companyName 에러', () => {
    const result = validateApplication({ ...validData, companyName: '   ' });
    expect(result.companyName).toBeDefined();
  });

  it('careerLevel 빈 문자열 → careerLevel 에러', () => {
    const result = validateApplication({ ...validData, careerLevel: '' });
    expect(result.careerLevel).toBeDefined();
  });

  it('deadline 빈 문자열 → deadline 에러', () => {
    const result = validateApplication({ ...validData, deadline: '' });
    expect(result.deadline).toBeDefined();
  });

  it('과거 deadline → deadline 에러', () => {
    const result = validateApplication({ ...validData, deadline: '2020-01-01' });
    expect(result.deadline).toBeDefined();
  });

  it('오늘 deadline → 에러 없음', () => {
    const today = new Date().toISOString().split('T')[0];
    const result = validateApplication({ ...validData, deadline: today });
    expect(result.deadline).toBeUndefined();
  });

  it('잘못된 companySize → companySize 에러', () => {
    const result = validateApplication({ ...validData, companySize: '잘못된값' });
    expect(result.companySize).toBeDefined();
  });

  it('빈 companySize → companySize 에러', () => {
    const result = validateApplication({ ...validData, companySize: '' });
    expect(result.companySize).toBeDefined();
  });

  it('잘못된 status → status 에러', () => {
    const result = validateApplication({ ...validData, status: '잘못된상태' });
    expect(result.status).toBeDefined();
  });

  it('coverLetter question 빈 문자열 → coverLetters 에러', () => {
    const result = validateApplication({
      ...validData,
      coverLetters: [{ id: 'cl-1', question: '', answer: '', type: null }],
    });
    expect(result.coverLetters).toBeDefined();
  });

  it('coverLetter question 공백만 → coverLetters 에러', () => {
    const result = validateApplication({
      ...validData,
      coverLetters: [{ id: 'cl-1', question: '   ', answer: '', type: null }],
    });
    expect(result.coverLetters).toBeDefined();
  });

  it('coverLetter question 있으면 coverLetters 에러 없음', () => {
    const result = validateApplication({
      ...validData,
      coverLetters: [{ id: 'cl-1', question: '지원 동기를 써주세요', answer: '', type: null }],
    });
    expect(result.coverLetters).toBeUndefined();
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npm test -- --testPathPatterns="applicationValidation" --no-coverage
```

Expected: FAIL (모듈 없음)

- [ ] **Step 3: `lib/applicationValidation.ts` 구현**

```typescript
import type { ApplicationStatus, CompanySize, CoverLetterType } from './types';

export const COMPANY_SIZES: CompanySize[] = ['대기업', '중견기업', '중소기업', '스타트업'];
export const APPLICATION_STATUSES: ApplicationStatus[] = [
  '지원 예정',
  '코테 기간',
  '면접 기간',
  '지원 완료',
  '서류 탈락',
  '코테 탈락',
  '면접 탈락',
  '최종 합격',
];

export interface CoverLetterDraft {
  id: string;
  question: string;
  answer: string;
  type: CoverLetterType | null;
}

export interface NewApplicationData {
  companyName: string;
  careerLevel: string;
  deadline: string; // YYYY-MM-DD
  companySize: string;
  status: string;
  coverLetters: CoverLetterDraft[];
}

export interface FormErrors {
  companyName?: string;
  careerLevel?: string;
  deadline?: string;
  companySize?: string;
  status?: string;
  coverLetters?: string;
}

export function validateApplication(data: NewApplicationData): FormErrors {
  const errors: FormErrors = {};

  if (!data.companyName.trim()) {
    errors.companyName = '회사명을 입력해주세요.';
  }

  if (!data.careerLevel.trim()) {
    errors.careerLevel = '경력을 입력해주세요.';
  }

  if (!data.deadline) {
    errors.deadline = '마감일을 입력해주세요.';
  } else {
    const deadlineDate = new Date(data.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadlineDate < today) {
      errors.deadline = '마감일은 오늘 이후여야 합니다.';
    }
  }

  if (!COMPANY_SIZES.includes(data.companySize as CompanySize)) {
    errors.companySize = '기업 규모를 선택해주세요.';
  }

  if (!APPLICATION_STATUSES.includes(data.status as ApplicationStatus)) {
    errors.status = '상태를 선택해주세요.';
  }

  const hasInvalidCoverLetter = data.coverLetters.some((cl) => !cl.question.trim());
  if (hasInvalidCoverLetter) {
    errors.coverLetters = '자기소개서 항목에 질문을 입력해주세요.';
  }

  return errors;
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npm test -- --testPathPatterns="applicationValidation" --no-coverage
```

Expected: 13 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/applicationValidation.ts __tests__/applications/applicationValidation.test.ts
git commit -m "feat: 지원서 유효성 검사 함수 추가 (TDD)"
```

---

### Task 2: `addApplication` 추가

**Files:**
- Modify: `lib/applications.ts`

- [ ] **Step 1: `lib/applications.ts` import 수정 및 함수 추가**

기존 `import type { Application } from './types';`를 아래로 교체:

```typescript
import type { Application, ApplicationStatus, CompanySize, CoverLetterQA } from './types';
```

파일 끝에 추가:

```typescript
export function addApplication(data: {
  companyName: string;
  careerLevel: string;
  deadline: Date;
  companySize: CompanySize;
  status: ApplicationStatus;
  coverLetters: CoverLetterQA[];
}): Application {
  const newApp: Application = {
    id: String(Date.now()),
    ...data,
  };
  applications.push(newApp);
  return newApp;
}
```

- [ ] **Step 2: 커밋**

```bash
git add lib/applications.ts
git commit -m "feat: addApplication 함수 추가"
```

---

### Task 3: Server Action 생성

**Files:**
- Create: `app/applications/actions.ts`

- [ ] **Step 1: `app/applications/actions.ts` 생성**

```typescript
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
```

- [ ] **Step 2: 커밋**

```bash
git add app/applications/actions.ts
git commit -m "feat: createApplication Server Action 추가"
```

---

### Task 4: NewApplicationForm — 테스트 작성 후 구현

**Files:**
- Create: `components/NewApplicationForm.tsx`
- Create: `__tests__/applications/NewApplicationForm.test.tsx`

- [ ] **Step 1: 테스트 파일 작성**

`__tests__/applications/NewApplicationForm.test.tsx` 생성:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewApplicationForm } from '@/components/NewApplicationForm';
import * as actions from '@/app/applications/actions';

jest.mock('@/app/applications/actions', () => ({
  createApplication: jest.fn().mockResolvedValue({}),
}));

const futureDateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('회사명'), { target: { value: '네이버' } });
  fireEvent.change(screen.getByLabelText('경력'), { target: { value: '신입' } });
  fireEvent.change(screen.getByLabelText('마감일'), { target: { value: futureDateStr() } });
  fireEvent.change(screen.getByLabelText('기업 규모'), { target: { value: '대기업' } });
}

describe('NewApplicationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('폼이 렌더링된다', () => {
    render(<NewApplicationForm />);
    expect(screen.getByLabelText('회사명')).toBeInTheDocument();
    expect(screen.getByLabelText('경력')).toBeInTheDocument();
    expect(screen.getByLabelText('마감일')).toBeInTheDocument();
    expect(screen.getByLabelText('기업 규모')).toBeInTheDocument();
    expect(screen.getByLabelText('상태')).toBeInTheDocument();
  });

  it('필수 필드 비우고 제출 → 에러 메시지 표시', async () => {
    render(<NewApplicationForm />);
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByText('회사명을 입력해주세요.')).toBeInTheDocument();
    expect(screen.getByText('경력을 입력해주세요.')).toBeInTheDocument();
    expect(screen.getByText('마감일을 입력해주세요.')).toBeInTheDocument();
    expect(screen.getByText('기업 규모를 선택해주세요.')).toBeInTheDocument();
  });

  it('에러 있으면 createApplication 호출 안 함', () => {
    render(<NewApplicationForm />);
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(actions.createApplication).not.toHaveBeenCalled();
  });

  it('유효한 값 입력 후 제출 → createApplication 호출', async () => {
    render(<NewApplicationForm />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect(actions.createApplication).toHaveBeenCalledTimes(1);
    });
    expect(actions.createApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        companyName: '네이버',
        careerLevel: '신입',
        companySize: '대기업',
      }),
    );
  });

  it('제출 성공 후 폼 초기화', async () => {
    render(<NewApplicationForm />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect((screen.getByLabelText('회사명') as HTMLInputElement).value).toBe('');
    });
  });

  it('"질문 추가" 버튼 클릭 → 자기소개서 입력 영역 추가', () => {
    render(<NewApplicationForm />);
    fireEvent.click(screen.getByRole('button', { name: /질문 추가/ }));
    expect(screen.getByLabelText('자기소개서 1 질문')).toBeInTheDocument();
  });

  it('coverLetter 추가 후 question 비우고 제출 → 에러 메시지', async () => {
    render(<NewApplicationForm />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: /질문 추가/ }));
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByText('자기소개서 항목에 질문을 입력해주세요.')).toBeInTheDocument();
    expect(actions.createApplication).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npm test -- --testPathPatterns="NewApplicationForm" --no-coverage
```

Expected: FAIL (모듈 없음)

- [ ] **Step 3: `components/NewApplicationForm.tsx` 구현**

```typescript
'use client';

import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
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
      setForm(INITIAL_FORM);
      setErrors({});
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
              <span className="text-xs text-muted-foreground">자기소개서 {idx + 1}</span>
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
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npm test -- --testPathPatterns="NewApplicationForm" --no-coverage
```

Expected: 7 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add components/NewApplicationForm.tsx __tests__/applications/NewApplicationForm.test.tsx
git commit -m "feat: NewApplicationForm 컴포넌트 추가 (TDD)"
```

---

### Task 5: 목록 페이지에 폼 연결

**Files:**
- Modify: `app/applications/page.tsx`

- [ ] **Step 1: `app/applications/page.tsx` 수정**

상단에 import 추가:

```typescript
import { NewApplicationForm } from '@/components/NewApplicationForm';
```

"새 지원서 추가" Link 버튼을 제거하고, `<main>` 안에 `NewApplicationForm`을 목록 위에 추가:

```typescript
export default function ApplicationsPage() {
  const apps = getApplications();

  return (
    <main className="py-8">
      <NewApplicationForm />

      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">입사 지원 현황</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            총 {apps.length}개의 지원서
          </p>
        </div>
      </div>

      {/* 지원서 목록 */}
      <ul className="mt-6 flex flex-col gap-3">
        {apps.map((app) => {
          const dday = calculateDDay(app.deadline);
          return (
            <li key={app.id}>
              <Link href={`/applications/${app.id}`} className="block">
                <Card className="transition-opacity hover:opacity-80">
                  <CardHeader>
                    <CardTitle>{app.companyName}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5">
                      <Badge className="gap-1 text-xs font-normal">
                        <BriefcaseIcon />
                        {app.careerLevel}
                      </Badge>
                      <Badge className="gap-1 text-xs font-normal">
                        <CalendarIcon />
                        {formatDDay(dday)}
                      </Badge>
                      <Badge className="gap-1 text-xs font-normal">
                        <BuildingIcon />
                        {app.companySize}
                      </Badge>
                    </CardDescription>
                    <CardAction className="self-center">
                      <Badge
                        variant={statusBadgeVariant(app.status)}
                        className={cn(
                          "h-7 gap-1.5 px-3 text-xs",
                          statusBadgeClass(app.status),
                        )}
                      >
                        <CircleDotIcon />
                        {app.status}
                      </Badge>
                    </CardAction>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
```

- [ ] **Step 2: 전체 테스트 실행**

```bash
npm test -- --no-coverage
```

Expected: 모든 테스트 PASS

- [ ] **Step 3: 커밋**

```bash
git add app/applications/page.tsx
git commit -m "feat: 지원서 생성 인라인 폼을 목록 페이지에 연결"
```
