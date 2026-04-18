# 마이페이지 확장 & 알림 시스템 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 마이페이지를 프로필 관리 허브로 확장하고, 인앱 알림 시스템(벨 아이콘 + 드롭다운/페이지)을 추가한다.

**Architecture:** User 모델에 프로필 필드 10개를 추가하고, Notification 모델을 새로 생성한다. 마이페이지는 단일 페이지 섹션형 레이아웃으로 각 섹션에 인라인 편집 기능을 둔다. 알림은 헤더 벨 아이콘으로 표시하며, 데스크톱에서는 Popover 드롭다운, 모바일에서는 독립 페이지(`/notifications`)로 분기한다.

**Tech Stack:** Next.js App Router, Prisma ORM (PostgreSQL), React Query, shadcn/ui (Popover), Tailwind CSS, lucide-react

**Spec:** `docs/superpowers/specs/2026-04-18-mypage-notifications-design.md`

---

## File Structure

### 신규 생성 파일

```
app/(tabs)/mypage/_components/
├── ProfileHeader.tsx        # 프로필 헤더 섹션 (이미지, 이름, bio)
├── DesiredConditions.tsx     # 희망 조건 섹션 (직무, 업종, 지역)
├── EducationCareer.tsx       # 학력 & 경력 섹션
├── TechStacks.tsx            # 기술 스택 섹션
├── CertPortfolio.tsx         # 자격증 & 포트폴리오 섹션
└── TagInput.tsx              # 태그 입력 공용 컴포넌트

app/(tabs)/notifications/
├── page.tsx                  # 모바일 알림 전체 페이지

app/api/user/profile/
└── route.ts                  # GET/PATCH 프로필 API

app/api/notifications/
├── route.ts                  # GET 알림 목록
├── read/route.ts             # PATCH 읽음 처리
└── unread-count/route.ts     # GET 읽지 않은 개수

components/
├── NotificationBell.tsx      # 벨 아이콘 + 뱃지 + 드롭다운/링크
└── NotificationItem.tsx      # 개별 알림 항목

lib/
├── profileApi.ts             # 프로필 API 클라이언트 함수
├── notificationApi.ts        # 알림 API 클라이언트 함수
└── useMediaQuery.ts          # 미디어 쿼리 훅 (데스크톱/모바일 분기)

__tests__/
├── profile/profileApi.test.ts
└── notifications/notificationApi.test.ts
```

### 수정 파일

```
prisma/schema.prisma          # User 필드 추가, Notification 모델/enum 추가
app/(tabs)/mypage/page.tsx     # 섹션 컴포넌트 조합으로 교체
components/ui/header.tsx       # NotificationBell 추가
lib/types.ts                   # UserProfile, Notification 타입 추가
```

---

## Task 1: DB 스키마 마이그레이션

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: User 모델에 프로필 필드 추가**

`prisma/schema.prisma`의 User 모델에 다음 필드를 추가한다:

```prisma
model User {
  id            String           @id @default(cuid())
  name          String?
  email         String?          @unique
  emailVerified DateTime?
  image         String?
  bio             String?
  desiredJob      String?
  desiredIndustry String?
  desiredRegion   String?
  school          String?
  major           String?
  careerLevel     String?
  portfolioUrl    String?
  certifications  Json?
  techStacks      Json?
  accounts       Account[]
  applications   Application[]
  scheduleEvents ScheduleEvent[]
  quizResults    UserQuizResult[]
  notifications  Notification[]
  createdAt      DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
}
```

- [ ] **Step 2: Notification 모델과 enum 추가**

`prisma/schema.prisma` 파일 하단에 추가:

```prisma
model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String
  message   String
  isRead    Boolean          @default(false)
  relatedId String?
  createdAt DateTime         @default(now())

  @@index([userId])
  @@index([userId, isRead])
}

enum NotificationType {
  DEADLINE
  SCHEDULE
  STATUS_CHANGE
}
```

- [ ] **Step 3: 마이그레이션 실행**

Run: `npx prisma migrate dev --name add-profile-and-notifications`

Expected: Migration applied successfully

- [ ] **Step 4: Prisma 클라이언트 재생성 확인**

Run: `npx prisma generate`

Expected: Generated Prisma Client

- [ ] **Step 5: 커밋**

```bash
git add prisma/
git commit -m "feat: User 프로필 필드 및 Notification 모델 추가"
```

---

## Task 2: 타입 정의 및 API 클라이언트 함수

**Files:**
- Modify: `lib/types.ts`
- Create: `lib/profileApi.ts`
- Create: `lib/notificationApi.ts`
- Create: `__tests__/profile/profileApi.test.ts`
- Create: `__tests__/notifications/notificationApi.test.ts`

- [ ] **Step 1: lib/types.ts에 타입 추가**

`lib/types.ts` 파일 하단에 추가:

```typescript
export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  desiredJob: string | null;
  desiredIndustry: string | null;
  desiredRegion: string | null;
  school: string | null;
  major: string | null;
  careerLevel: string | null;
  portfolioUrl: string | null;
  certifications: string[];
  techStacks: string[];
}

export type NotificationType = '마감 임박' | '일정 알림' | '상태 변경';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedId: string | null;
  createdAt: string;
}
```

- [ ] **Step 2: lib/profileApi.ts 작성**

```typescript
import type { UserProfile } from './types';

export async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch('/api/user/profile');
  if (!res.ok) throw new Error('프로필을 불러오지 못했습니다.');
  return res.json();
}

export async function updateProfile(data: Partial<Omit<UserProfile, 'id' | 'name' | 'email' | 'image'>>): Promise<UserProfile> {
  const res = await fetch('/api/user/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json();
    throw body;
  }
  return res.json();
}
```

- [ ] **Step 3: lib/notificationApi.ts 작성**

```typescript
import type { Notification } from './types';

export async function fetchNotifications(limit = 10, offset = 0): Promise<Notification[]> {
  const res = await fetch(`/api/notifications?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error('알림을 불러오지 못했습니다.');
  return res.json();
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await fetch('/api/notifications/unread-count');
  if (!res.ok) throw new Error('읽지 않은 알림 수를 불러오지 못했습니다.');
  const data: { count: number } = await res.json();
  return data.count;
}

export async function markAsRead(ids: string[]): Promise<void> {
  const res = await fetch('/api/notifications/read', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error('알림 읽음 처리에 실패했습니다.');
}

export async function markAllAsRead(): Promise<void> {
  const res = await fetch('/api/notifications/read', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ all: true }),
  });
  if (!res.ok) throw new Error('알림 전체 읽음 처리에 실패했습니다.');
}
```

- [ ] **Step 4: 프로필 API 클라이언트 테스트 작성**

`__tests__/profile/profileApi.test.ts`:

```typescript
import { fetchProfile, updateProfile } from '@/lib/profileApi';

const mockProfile = {
  id: 'user1',
  name: '테스트',
  email: 'test@test.com',
  image: null,
  bio: '안녕하세요',
  desiredJob: '프론트엔드',
  desiredIndustry: 'IT',
  desiredRegion: '서울',
  school: '테스트대학교',
  major: '컴퓨터공학',
  careerLevel: '신입',
  portfolioUrl: 'https://github.com/test',
  certifications: ['정보처리기사'],
  techStacks: ['React', 'TypeScript'],
};

beforeEach(() => {
  global.fetch = jest.fn();
});

describe('fetchProfile', () => {
  it('프로필을 정상 조회한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProfile),
    });

    const result = await fetchProfile();
    expect(result).toEqual(mockProfile);
    expect(fetch).toHaveBeenCalledWith('/api/user/profile');
  });

  it('실패 시 에러를 던진다', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false });
    await expect(fetchProfile()).rejects.toThrow('프로필을 불러오지 못했습니다.');
  });
});

describe('updateProfile', () => {
  it('프로필을 부분 업데이트한다', async () => {
    const updated = { ...mockProfile, bio: '변경됨' };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(updated),
    });

    const result = await updateProfile({ bio: '변경됨' });
    expect(result.bio).toBe('변경됨');
    expect(fetch).toHaveBeenCalledWith('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio: '변경됨' }),
    });
  });
});
```

- [ ] **Step 5: 알림 API 클라이언트 테스트 작성**

`__tests__/notifications/notificationApi.test.ts`:

```typescript
import { fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead } from '@/lib/notificationApi';

const mockNotification = {
  id: 'n1',
  type: '마감 임박' as const,
  title: '마감 임박: 네이버',
  message: 'D-1 | 내일 마감입니다',
  isRead: false,
  relatedId: 'app1',
  createdAt: '2026-04-18T00:00:00.000Z',
};

beforeEach(() => {
  global.fetch = jest.fn();
});

describe('fetchNotifications', () => {
  it('알림 목록을 조회한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockNotification]),
    });

    const result = await fetchNotifications(10, 0);
    expect(result).toEqual([mockNotification]);
    expect(fetch).toHaveBeenCalledWith('/api/notifications?limit=10&offset=0');
  });
});

describe('fetchUnreadCount', () => {
  it('읽지 않은 알림 수를 반환한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ count: 3 }),
    });

    const count = await fetchUnreadCount();
    expect(count).toBe(3);
  });
});

describe('markAsRead', () => {
  it('특정 알림을 읽음 처리한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true });

    await markAsRead(['n1', 'n2']);
    expect(fetch).toHaveBeenCalledWith('/api/notifications/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ['n1', 'n2'] }),
    });
  });
});

describe('markAllAsRead', () => {
  it('모든 알림을 읽음 처리한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true });

    await markAllAsRead();
    expect(fetch).toHaveBeenCalledWith('/api/notifications/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
  });
});
```

- [ ] **Step 6: 테스트 실행**

Run: `npx jest __tests__/profile __tests__/notifications --verbose`

Expected: All tests PASS

- [ ] **Step 7: lint & tsc 확인**

Run: `npx eslint lib/types.ts lib/profileApi.ts lib/notificationApi.ts && npx tsc --noEmit`

Expected: No errors

- [ ] **Step 8: 커밋**

```bash
git add lib/types.ts lib/profileApi.ts lib/notificationApi.ts __tests__/profile __tests__/notifications
git commit -m "feat: 프로필/알림 타입 및 API 클라이언트 함수 추가"
```

---

## Task 3: 프로필 API 라우트

**Files:**
- Create: `app/api/user/profile/route.ts`

- [ ] **Step 1: GET/PATCH 프로필 API 작성**

`app/api/user/profile/route.ts`:

```typescript
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
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      desiredJob: true,
      desiredIndustry: true,
      desiredRegion: true,
      school: true,
      major: true,
      careerLevel: true,
      portfolioUrl: true,
      certifications: true,
      techStacks: true,
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
  'bio', 'desiredJob', 'desiredIndustry', 'desiredRegion',
  'school', 'major', 'careerLevel', 'portfolioUrl',
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
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      desiredJob: true,
      desiredIndustry: true,
      desiredRegion: true,
      school: true,
      major: true,
      careerLevel: true,
      portfolioUrl: true,
      certifications: true,
      techStacks: true,
    },
  });

  return Response.json({
    ...user,
    certifications: (user.certifications as string[]) ?? [],
    techStacks: (user.techStacks as string[]) ?? [],
  });
}
```

- [ ] **Step 2: lint & tsc 확인**

Run: `npx eslint app/api/user/profile/route.ts && npx tsc --noEmit`

Expected: No errors

- [ ] **Step 3: 커밋**

```bash
git add app/api/user/profile
git commit -m "feat: 프로필 GET/PATCH API 라우트 추가"
```

---

## Task 4: 알림 API 라우트

**Files:**
- Create: `app/api/notifications/route.ts`
- Create: `app/api/notifications/unread-count/route.ts`
- Create: `app/api/notifications/read/route.ts`

- [ ] **Step 1: 알림 enum 매핑 추가**

`lib/enumMaps.ts` 파일 하단에 추가:

```typescript
import { NotificationType as DbNotificationType } from './generated/prisma/client';
import type { NotificationType } from './types';

export const NOTIFICATION_TYPE_FROM_DB: Record<DbNotificationType, NotificationType> = {
  DEADLINE: '마감 임박',
  SCHEDULE: '일정 알림',
  STATUS_CHANGE: '상태 변경',
};
```

- [ ] **Step 2: GET /api/notifications 작성**

`app/api/notifications/route.ts`:

```typescript
import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';
import { NOTIFICATION_TYPE_FROM_DB } from '@/lib/enumMaps';

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 10, 50);
  const offset = Number(searchParams.get('offset')) || 0;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  return Response.json(
    notifications.map((n) => ({
      id: n.id,
      type: NOTIFICATION_TYPE_FROM_DB[n.type],
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      relatedId: n.relatedId,
      createdAt: n.createdAt.toISOString(),
    })),
  );
}
```

- [ ] **Step 3: GET /api/notifications/unread-count 작성**

`app/api/notifications/unread-count/route.ts`:

```typescript
import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return Response.json({ count });
}
```

- [ ] **Step 4: PATCH /api/notifications/read 작성**

`app/api/notifications/read/route.ts`:

```typescript
import { prisma } from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth';

export async function PATCH(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json();

  if (body.all === true) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  } else if (Array.isArray(body.ids) && body.ids.length > 0) {
    await prisma.notification.updateMany({
      where: { id: { in: body.ids }, userId },
      data: { isRead: true },
    });
  } else {
    return Response.json({ message: 'ids 또는 all 파라미터가 필요합니다.' }, { status: 400 });
  }

  return Response.json({ success: true });
}
```

- [ ] **Step 5: lint & tsc 확인**

Run: `npx eslint lib/enumMaps.ts app/api/notifications/route.ts app/api/notifications/unread-count/route.ts app/api/notifications/read/route.ts && npx tsc --noEmit`

Expected: No errors

- [ ] **Step 6: 커밋**

```bash
git add lib/enumMaps.ts app/api/notifications
git commit -m "feat: 알림 API 라우트 추가 (목록, 읽지않은수, 읽음처리)"
```

---

## Task 5: TagInput 공용 컴포넌트

**Files:**
- Create: `app/(tabs)/mypage/_components/TagInput.tsx`

- [ ] **Step 1: TagInput 컴포넌트 작성**

`app/(tabs)/mypage/_components/TagInput.tsx`:

```tsx
'use client';

import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ tags, onChange, placeholder = '입력 후 Enter' }: TagInputProps) {
  const [input, setInput] = useState('');

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = input.trim();
      if (value && !tags.includes(value)) {
        onChange([...tags, value]);
      }
      setInput('');
    }
    if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-ring">
      {tags.map((tag, i) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
```

- [ ] **Step 2: lint 확인**

Run: `npx eslint app/\(tabs\)/mypage/_components/TagInput.tsx`

Expected: No errors

- [ ] **Step 3: 커밋**

```bash
git add "app/(tabs)/mypage/_components/TagInput.tsx"
git commit -m "feat: TagInput 공용 컴포넌트 추가"
```

---

## Task 6: 마이페이지 섹션 컴포넌트

**Files:**
- Create: `app/(tabs)/mypage/_components/ProfileHeader.tsx`
- Create: `app/(tabs)/mypage/_components/DesiredConditions.tsx`
- Create: `app/(tabs)/mypage/_components/EducationCareer.tsx`
- Create: `app/(tabs)/mypage/_components/TechStacks.tsx`
- Create: `app/(tabs)/mypage/_components/CertPortfolio.tsx`

- [ ] **Step 1: ProfileHeader.tsx 작성**

`app/(tabs)/mypage/_components/ProfileHeader.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CircleUserRound, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserProfile } from '@/lib/types';

interface ProfileHeaderProps {
  profile: UserProfile;
  onSave: (data: { bio: string | null }) => Promise<void>;
}

export function ProfileHeader({ profile, onSave }: ProfileHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ bio: bio.trim() || null });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setBio(profile.bio ?? '');
    setEditing(false);
  }

  return (
    <section className="flex items-center gap-4 p-6 rounded-2xl bg-card border border-border">
      {profile.image ? (
        <Image
          src={profile.image}
          alt="프로필"
          width={64}
          height={64}
          className="rounded-full shrink-0"
        />
      ) : (
        <CircleUserRound className="size-16 text-muted-foreground shrink-0" />
      )}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-lg font-semibold">{profile.name ?? '사용자'}</p>
        {profile.email && (
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        )}
        {editing ? (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="한줄 자기소개를 입력하세요"
              maxLength={100}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
            <Button size="sm" onClick={handleSave} disabled={saving}>
              저장
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              취소
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {profile.bio ? (
              <p className="text-sm text-muted-foreground italic">&quot;{profile.bio}&quot;</p>
            ) : (
              <p className="text-sm text-muted-foreground">한줄 자기소개를 추가해보세요</p>
            )}
          </div>
        )}
      </div>
      {!editing && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditing(true)}
          className="shrink-0"
        >
          <Pencil className="size-3.5 mr-1.5" />
          편집
        </Button>
      )}
    </section>
  );
}
```

- [ ] **Step 2: DesiredConditions.tsx 작성**

`app/(tabs)/mypage/_components/DesiredConditions.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Target, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserProfile } from '@/lib/types';

interface DesiredConditionsProps {
  profile: UserProfile;
  onSave: (data: { desiredJob: string | null; desiredIndustry: string | null; desiredRegion: string | null }) => Promise<void>;
}

export function DesiredConditions({ profile, onSave }: DesiredConditionsProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    desiredJob: profile.desiredJob ?? '',
    desiredIndustry: profile.desiredIndustry ?? '',
    desiredRegion: profile.desiredRegion ?? '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        desiredJob: form.desiredJob.trim() || null,
        desiredIndustry: form.desiredIndustry.trim() || null,
        desiredRegion: form.desiredRegion.trim() || null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm({
      desiredJob: profile.desiredJob ?? '',
      desiredIndustry: profile.desiredIndustry ?? '',
      desiredRegion: profile.desiredRegion ?? '',
    });
    setEditing(false);
  }

  const fields = [
    { key: 'desiredJob' as const, label: '희망 직무' },
    { key: 'desiredIndustry' as const, label: '희망 업종' },
    { key: 'desiredRegion' as const, label: '희망 지역' },
  ];

  return (
    <section className="p-5 rounded-2xl bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-semibold">
          <Target className="size-4" />
          희망 조건
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5 mr-1.5" />
            편집
          </Button>
        )}
      </div>
      {editing ? (
        <div className="space-y-3">
          {fields.map(({ key, label }) => (
            <div key={key}>
              <label className="text-sm text-muted-foreground mb-1 block">{label}</label>
              <input
                type="text"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={`${label}을 입력하세요`}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave} disabled={saving}>저장</Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>취소</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {fields.map(({ key, label }) => (
            <div key={key}>
              <p className="text-muted-foreground mb-1">{label}</p>
              <p>{profile[key] || '-'}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: EducationCareer.tsx 작성**

`app/(tabs)/mypage/_components/EducationCareer.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { GraduationCap, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserProfile } from '@/lib/types';

interface EducationCareerProps {
  profile: UserProfile;
  onSave: (data: { school: string | null; major: string | null; careerLevel: string | null }) => Promise<void>;
}

const CAREER_LEVELS = ['신입', '1~3년', '3~5년', '5년 이상'];

export function EducationCareer({ profile, onSave }: EducationCareerProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    school: profile.school ?? '',
    major: profile.major ?? '',
    careerLevel: profile.careerLevel ?? '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        school: form.school.trim() || null,
        major: form.major.trim() || null,
        careerLevel: form.careerLevel || null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm({
      school: profile.school ?? '',
      major: profile.major ?? '',
      careerLevel: profile.careerLevel ?? '',
    });
    setEditing(false);
  }

  return (
    <section className="p-5 rounded-2xl bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-semibold">
          <GraduationCap className="size-4" />
          학력 & 경력
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5 mr-1.5" />
            편집
          </Button>
        )}
      </div>
      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">학교</label>
            <input
              type="text"
              value={form.school}
              onChange={(e) => setForm({ ...form, school: e.target.value })}
              placeholder="학교명을 입력하세요"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">전공</label>
            <input
              type="text"
              value={form.major}
              onChange={(e) => setForm({ ...form, major: e.target.value })}
              placeholder="전공을 입력하세요"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">경력 수준</label>
            <select
              value={form.careerLevel}
              onChange={(e) => setForm({ ...form, careerLevel: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">선택하세요</option>
              {CAREER_LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave} disabled={saving}>저장</Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>취소</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">학교 / 전공</p>
            <p>
              {profile.school || profile.major
                ? [profile.school, profile.major].filter(Boolean).join(' ')
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">경력 수준</p>
            <p>{profile.careerLevel || '-'}</p>
          </div>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: TechStacks.tsx 작성**

`app/(tabs)/mypage/_components/TechStacks.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Code, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TagInput } from './TagInput';
import type { UserProfile } from '@/lib/types';

interface TechStacksProps {
  profile: UserProfile;
  onSave: (data: { techStacks: string[] }) => Promise<void>;
}

export function TechStacks({ profile, onSave }: TechStacksProps) {
  const [editing, setEditing] = useState(false);
  const [tags, setTags] = useState<string[]>(profile.techStacks);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ techStacks: tags });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setTags(profile.techStacks);
    setEditing(false);
  }

  return (
    <section className="p-5 rounded-2xl bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-semibold">
          <Code className="size-4" />
          기술 스택
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5 mr-1.5" />
            편집
          </Button>
        )}
      </div>
      {editing ? (
        <div className="space-y-3">
          <TagInput tags={tags} onChange={setTags} placeholder="기술 스택 입력 후 Enter" />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>저장</Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>취소</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {profile.techStacks.length > 0 ? (
            profile.techStacks.map((tech) => (
              <span key={tech} className="rounded-full bg-muted px-3 py-1 text-sm">
                {tech}
              </span>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">기술 스택을 추가해보세요</p>
          )}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 5: CertPortfolio.tsx 작성**

`app/(tabs)/mypage/_components/CertPortfolio.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Award, Pencil, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TagInput } from './TagInput';
import type { UserProfile } from '@/lib/types';

interface CertPortfolioProps {
  profile: UserProfile;
  onSave: (data: { certifications: string[]; portfolioUrl: string | null }) => Promise<void>;
}

export function CertPortfolio({ profile, onSave }: CertPortfolioProps) {
  const [editing, setEditing] = useState(false);
  const [certs, setCerts] = useState<string[]>(profile.certifications);
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolioUrl ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        certifications: certs,
        portfolioUrl: portfolioUrl.trim() || null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setCerts(profile.certifications);
    setPortfolioUrl(profile.portfolioUrl ?? '');
    setEditing(false);
  }

  return (
    <section className="p-5 rounded-2xl bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-semibold">
          <Award className="size-4" />
          자격증 & 포트폴리오
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5 mr-1.5" />
            편집
          </Button>
        )}
      </div>
      {editing ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">자격증</label>
            <TagInput tags={certs} onChange={setCerts} placeholder="자격증 입력 후 Enter" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">포트폴리오 URL</label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://github.com/username"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>저장</Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>취소</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground mb-2">자격증</p>
            <div className="flex flex-wrap gap-2">
              {profile.certifications.length > 0 ? (
                profile.certifications.map((cert) => (
                  <span key={cert} className="rounded-full bg-emerald-950 border border-emerald-800 px-3 py-1 text-emerald-300">
                    {cert}
                  </span>
                ))
              ) : (
                <p className="text-muted-foreground">자격증을 추가해보세요</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">포트폴리오</p>
            {profile.portfolioUrl ? (
              <a
                href={profile.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                {profile.portfolioUrl}
                <ExternalLink className="size-3" />
              </a>
            ) : (
              <p className="text-muted-foreground">포트폴리오 링크를 추가해보세요</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 6: lint 확인**

Run: `npx eslint "app/(tabs)/mypage/_components/ProfileHeader.tsx" "app/(tabs)/mypage/_components/DesiredConditions.tsx" "app/(tabs)/mypage/_components/EducationCareer.tsx" "app/(tabs)/mypage/_components/TechStacks.tsx" "app/(tabs)/mypage/_components/CertPortfolio.tsx"`

Expected: No errors

- [ ] **Step 7: 커밋**

```bash
git add "app/(tabs)/mypage/_components/"
git commit -m "feat: 마이페이지 섹션 컴포넌트 추가 (프로필, 희망조건, 학력, 기술스택, 자격증)"
```

---

## Task 7: 마이페이지 통합

**Files:**
- Modify: `app/(tabs)/mypage/page.tsx`

- [ ] **Step 1: page.tsx를 섹션 컴포넌트 조합으로 교체**

`app/(tabs)/mypage/page.tsx`:

```tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FlameLoading } from '@/components/ui/flame-loading';
import { fetchProfile, updateProfile } from '@/lib/profileApi';
import type { UserProfile } from '@/lib/types';
import { ProfileHeader } from './_components/ProfileHeader';
import { DesiredConditions } from './_components/DesiredConditions';
import { EducationCareer } from './_components/EducationCareer';
import { TechStacks } from './_components/TechStacks';
import { CertPortfolio } from './_components/CertPortfolio';

export default function MyPage() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  const { mutateAsync } = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile'], updated);
    },
  });

  async function handleSave(data: Parameters<typeof updateProfile>[0]) {
    await mutateAsync(data);
  }

  if (isLoading || !profile) {
    return <FlameLoading />;
  }

  return (
    <div className="py-8 space-y-4">
      <h1 className="text-xl font-bold">마이페이지</h1>

      <ProfileHeader profile={profile} onSave={handleSave} />
      <DesiredConditions profile={profile} onSave={handleSave} />
      <EducationCareer profile={profile} onSave={handleSave} />
      <TechStacks profile={profile} onSave={handleSave} />
      <CertPortfolio profile={profile} onSave={handleSave} />

      <section className="p-5 rounded-2xl bg-card border border-border">
        <h2 className="font-semibold mb-3">계정 관리</h2>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 text-base text-destructive hover:text-destructive"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="size-5" />
          로그아웃
        </Button>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: lint & tsc 확인**

Run: `npx eslint "app/(tabs)/mypage/page.tsx" && npx tsc --noEmit`

Expected: No errors

- [ ] **Step 3: 커밋**

```bash
git add "app/(tabs)/mypage/page.tsx"
git commit -m "feat: 마이페이지 섹션 컴포넌트 통합"
```

---

## Task 8: NotificationItem 컴포넌트

**Files:**
- Create: `components/NotificationItem.tsx`

- [ ] **Step 1: NotificationItem 작성**

`components/NotificationItem.tsx`:

```tsx
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/types';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 border-b border-border transition-colors hover:bg-muted/50',
        !notification.isRead && 'bg-primary/5',
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-1.5 shrink-0">
          {!notification.isRead && (
            <div className="size-2 rounded-full bg-primary" />
          )}
          {notification.isRead && <div className="size-2" />}
        </div>
        <div className="min-w-0">
          <p className={cn('text-sm font-medium', notification.isRead && 'text-muted-foreground')}>
            {notification.title}
          </p>
          <p className={cn('text-xs mt-0.5', notification.isRead ? 'text-muted-foreground/60' : 'text-muted-foreground')}>
            {notification.message}
          </p>
          <p className={cn('text-xs mt-1', notification.isRead ? 'text-muted-foreground/40' : 'text-muted-foreground/60')}>
            {timeAgo(notification.createdAt)}
          </p>
        </div>
      </div>
    </button>
  );
}
```

- [ ] **Step 2: lint 확인**

Run: `npx eslint components/NotificationItem.tsx`

Expected: No errors

- [ ] **Step 3: 커밋**

```bash
git add components/NotificationItem.tsx
git commit -m "feat: NotificationItem 컴포넌트 추가"
```

---

## Task 9: NotificationBell 컴포넌트

**Files:**
- Create: `components/NotificationBell.tsx`
- Modify: `components/ui/header.tsx`

- [ ] **Step 1: NotificationBell 작성**

`components/NotificationBell.tsx`:

```tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationItem } from '@/components/NotificationItem';
import { fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead } from '@/lib/notificationApi';
import type { Notification } from '@/lib/types';
import { useMediaQuery } from '@/lib/useMediaQuery';

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    refetchInterval: 30000,
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications', 'list'],
    queryFn: () => fetchNotifications(10, 0),
  });

  const readMutation = useMutation({
    mutationFn: (ids: string[]) => markAsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  function handleNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      readMutation.mutate([notification.id]);
    }
    if (notification.relatedId) {
      if (notification.type === '일정 알림') {
        router.push('/schedule');
      } else {
        router.push(`/applications/${notification.relatedId}`);
      }
    }
  }

  const bellButton = (
    <button type="button" className="relative p-1">
      <Bell className="size-5 text-muted-foreground hover:text-white transition-colors" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center size-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground border-2 border-background">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );

  if (!isDesktop) {
    return (
      <Link href="/notifications">
        {bellButton}
      </Link>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        {bellButton}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-semibold text-sm">알림</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => readAllMutation.mutate()}
              className="text-xs text-primary hover:underline"
            >
              모두 읽음
            </button>
          )}
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onClick={() => handleNotificationClick(n)}
              />
            ))
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              알림이 없습니다
            </div>
          )}
        </div>
        <div className="border-t border-border px-4 py-2.5 text-center">
          <Link href="/notifications" className="text-sm text-primary hover:underline">
            전체 알림 보기 →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: useMediaQuery 훅 생성**

`lib/useMediaQuery.ts`:

```typescript
'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    function handler(e: MediaQueryListEvent) {
      setMatches(e.matches);
    }

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
```

- [ ] **Step 3: header.tsx에 NotificationBell 추가**

`components/ui/header.tsx`의 `<div className="ml-auto">` 내부를 수정한다. 프로필 아이콘 앞에 NotificationBell을 추가:

기존:
```tsx
      <div className="ml-auto">
        {session?.user ? (
          <Link href="/mypage" className="flex items-center">
```

변경:
```tsx
      <div className="ml-auto flex items-center gap-3">
        {session?.user ? (
          <>
            <NotificationBell />
            <Link href="/mypage" className="flex items-center">
```

그리고 닫는 태그도 수정:

기존:
```tsx
          </Link>
        ) : (
```

변경:
```tsx
            </Link>
          </>
        ) : (
```

파일 상단에 import 추가:
```tsx
import { NotificationBell } from '@/components/NotificationBell';
```

- [ ] **Step 4: lint & tsc 확인**

Run: `npx eslint components/NotificationBell.tsx lib/useMediaQuery.ts components/ui/header.tsx && npx tsc --noEmit`

Expected: No errors

- [ ] **Step 5: 커밋**

```bash
git add components/NotificationBell.tsx lib/useMediaQuery.ts components/ui/header.tsx
git commit -m "feat: 헤더에 알림 벨 아이콘 및 드롭다운 추가"
```

---

## Task 10: 모바일 알림 페이지

**Files:**
- Create: `app/(tabs)/notifications/page.tsx`

- [ ] **Step 1: 알림 페이지 작성**

`app/(tabs)/notifications/page.tsx`:

```tsx
'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FlameLoading } from '@/components/ui/flame-loading';
import { NotificationItem } from '@/components/NotificationItem';
import { fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead } from '@/lib/notificationApi';
import type { Notification } from '@/lib/types';

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
  });

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<Notification[]>({
    queryKey: ['notifications', 'infinite'],
    queryFn: ({ pageParam }) => fetchNotifications(PAGE_SIZE, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
  });

  const readMutation = useMutation({
    mutationFn: (ids: string[]) => markAsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  function handleNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      readMutation.mutate([notification.id]);
    }
    if (notification.relatedId) {
      if (notification.type === '일정 알림') {
        router.push('/schedule');
      } else {
        router.push(`/applications/${notification.relatedId}`);
      }
    }
  }

  const notifications = data?.pages.flat() ?? [];

  if (isLoading) {
    return <FlameLoading />;
  }

  return (
    <div className="py-4">
      <div className="flex items-center gap-3 mb-4">
        <button type="button" onClick={() => router.back()}>
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-semibold">알림</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => readAllMutation.mutate()}
            className="ml-auto text-xs text-primary hover:underline"
          >
            모두 읽음
          </button>
        )}
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {notifications.length > 0 ? (
          <>
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onClick={() => handleNotificationClick(n)}
              />
            ))}
            {hasNextPage && (
              <div className="py-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? '불러오는 중...' : '더 보기'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            알림이 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: lint & tsc 확인**

Run: `npx eslint "app/(tabs)/notifications/page.tsx" && npx tsc --noEmit`

Expected: No errors

- [ ] **Step 3: 커밋**

```bash
git add "app/(tabs)/notifications"
git commit -m "feat: 모바일 알림 전체 페이지 추가"
```

---

## Task 11: .gitignore 업데이트 및 전체 테스트

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: .gitignore에 .superpowers/ 추가**

`.gitignore` 파일에 다음 줄 추가:

```
.superpowers/
```

- [ ] **Step 2: 전체 테스트 실행**

Run: `npx jest --verbose`

Expected: All tests PASS

- [ ] **Step 3: 전체 tsc 확인**

Run: `npx tsc --noEmit`

Expected: No errors

- [ ] **Step 4: 커밋**

```bash
git add .gitignore
git commit -m "chore: .gitignore에 .superpowers/ 추가"
```

- [ ] **Step 5: 전체 변경사항 푸시**

Run: `git push origin master`
