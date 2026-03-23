# EMBER Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** EMBER 앱의 디자인 시스템을 shadcn/ui + Pretendard + Storybook 8로 구축한다.

**Architecture:** Tailwind v4 CSS variables로 EMBER 디자인 토큰 정의 → shadcn/ui 컴포넌트 설치 → Storybook 8로 각 컴포넌트 문서화. 모든 컴포넌트는 `components/ui/`에 위치하며 `stories/`에 대응하는 스토리 파일을 갖는다.

**Tech Stack:** Next.js 16.2.1, React 19.2.4, TypeScript, Tailwind CSS v4, shadcn/ui (latest), Storybook 8, Pretendard

---

## File Map

| File | Role |
|---|---|
| `app/globals.css` | EMBER 디자인 토큰 (CSS vars), Pretendard import |
| `components/ui/*` | shadcn/ui 생성 컴포넌트 |
| `components/ui/header.tsx` | EMBER 헤더 (flame 로고 + user icon) |
| `public/ember-flame.svg` | Group 199.svg 복사본 (flame 로고) |
| `.storybook/main.ts` | Storybook 설정 (Next.js + Tailwind v4) |
| `.storybook/preview.ts` | globals.css import, dark theme 기본값 |
| `stories/design-tokens.stories.tsx` | 색상/타이포그래피 토큰 스토리 |
| `stories/button.stories.tsx` | Button 스토리 |
| `stories/badge.stories.tsx` | Badge 스토리 |
| `stories/card.stories.tsx` | Card 스토리 |
| `stories/tabs.stories.tsx` | Tabs (미완료/완료) 스토리 |
| `stories/checkbox.stories.tsx` | Checkbox 스토리 |
| `stories/select.stories.tsx` | Select/Dropdown 스토리 |
| `stories/header.stories.tsx` | Header 스토리 |

---

## Task 1: Pretendard 폰트 + 디자인 토큰 설정

**Files:**
- Modify: `app/globals.css`
- Copy: `public/ember-flame.svg` (from `C:\Users\kimyechan\Downloads\Group 199.svg`)

- [ ] **Step 1: ember-flame.svg 복사**

```bash
cp "C:/Users/kimyechan/Downloads/Group 199.svg" "C:/Users/kimyechan/PycharmProjects/my-app/public/ember-flame.svg"
```

- [ ] **Step 2: Pretendard npm 패키지 설치**

```bash
npm install pretendard
```

- [ ] **Step 3: globals.css에 EMBER 디자인 토큰 작성**

`app/globals.css` 전체를 아래로 교체:

```css
@import "tailwindcss";
@import "pretendard/dist/web/static/pretendard.css";

:root {
  /* EMBER Color Tokens */
  --color-primary: #FE6E6E;
  --color-primary-dim: #FFF5A0;
  --color-background: #1C1C1E;
  --color-surface: #2D2D2D;
  --color-surface-elevated: #3A3A3A;
  --color-border: #3A3A3A;
  --color-text: #FFFFFF;
  --color-text-muted: #9B9B9B;
  --color-destructive: #FE6E6E;

  /* shadcn/ui 호환 토큰 */
  --background: 0 0% 11%;
  --foreground: 0 0% 100%;
  --card: 0 0% 18%;
  --card-foreground: 0 0% 100%;
  --popover: 0 0% 18%;
  --popover-foreground: 0 0% 100%;
  --primary: 0 98% 71%;
  --primary-foreground: 0 0% 100%;
  --secondary: 0 0% 23%;
  --secondary-foreground: 0 0% 100%;
  --muted: 0 0% 23%;
  --muted-foreground: 0 0% 61%;
  --accent: 0 0% 23%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 98% 71%;
  --destructive-foreground: 0 0% 100%;
  --border: 0 0% 23%;
  --input: 0 0% 23%;
  --ring: 0 98% 71%;
  --radius: 0.75rem;
}

@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --font-sans: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}

body {
  background: var(--color-background);
  color: var(--color-text);
  font-family: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}
```

- [ ] **Step 4: 개발 서버 실행해서 폰트 확인**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 열어 Pretendard 폰트 적용 확인.

---

## Task 2: shadcn/ui 초기화 및 컴포넌트 설치

**Files:**
- Create: `components.json` (shadcn 설정)
- Create: `lib/utils.ts`
- Create: `components/ui/button.tsx`, `badge.tsx`, `card.tsx`, `tabs.tsx`, `checkbox.tsx`, `select.tsx`

- [ ] **Step 1: shadcn/ui 초기화**

```bash
npx shadcn@latest init -d
```

프롬프트 응답:
- Style: Default
- Base color: Neutral
- CSS variables: Yes

- [ ] **Step 2: components.json 확인 — `tailwind.cssVariables: true`, `rsc: true` 인지 확인**

- [ ] **Step 3: 필요한 컴포넌트 한번에 설치**

```bash
npx shadcn@latest add button badge card tabs checkbox select
```

- [ ] **Step 4: components/ui/ 파일들이 생성됐는지 확인**

```bash
ls components/ui/
```

Expected: `button.tsx badge.tsx card.tsx tabs.tsx checkbox.tsx select.tsx utils.ts` 등

---

## Task 3: Storybook 8 설치 및 설정

**Files:**
- Create: `.storybook/main.ts`
- Create: `.storybook/preview.ts`

- [ ] **Step 1: Storybook 8 설치**

```bash
npx storybook@latest init --skip-install
npm install --save-dev @storybook/nextjs @storybook/addon-essentials @storybook/addon-interactions @storybook/test storybook
```

> `--skip-install` 후 수동 설치로 버전 충돌 방지

- [ ] **Step 2: `.storybook/main.ts` 작성**

```ts
import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  staticDirs: ["../public"],
};

export default config;
```

- [ ] **Step 3: `.storybook/preview.ts` 작성**

```ts
import type { Preview } from "@storybook/react";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "ember-dark",
      values: [
        { name: "ember-dark", value: "#1C1C1E" },
        { name: "light", value: "#ffffff" },
      ],
    },
    controls: { matchers: { color: /(background|color)$/i } },
  },
};

export default preview;
```

- [ ] **Step 4: package.json scripts에 storybook 추가됐는지 확인**

```bash
cat package.json | grep storybook
```

없으면 수동 추가:
```json
"storybook": "storybook dev -p 6006",
"build-storybook": "storybook build"
```

- [ ] **Step 5: Storybook 실행 확인**

```bash
npm run storybook
```

Expected: `http://localhost:6006` 열림

---

## Task 4: Design Tokens 스토리

**Files:**
- Create: `stories/design-tokens.stories.tsx`

- [ ] **Step 1: `stories/design-tokens.stories.tsx` 작성**

```tsx
import type { Meta, StoryObj } from "@storybook/react";

const colors = [
  { name: "Primary", var: "--color-primary", hex: "#FE6E6E" },
  { name: "Primary Dim", var: "--color-primary-dim", hex: "#FFF5A0" },
  { name: "Background", var: "--color-background", hex: "#1C1C1E" },
  { name: "Surface", var: "--color-surface", hex: "#2D2D2D" },
  { name: "Surface Elevated", var: "--color-surface-elevated", hex: "#3A3A3A" },
  { name: "Border", var: "--color-border", hex: "#3A3A3A" },
  { name: "Text", var: "--color-text", hex: "#FFFFFF" },
  { name: "Text Muted", var: "--color-text-muted", hex: "#9B9B9B" },
];

function ColorPalette() {
  return (
    <div className="p-6">
      <h2 className="text-white text-xl font-bold mb-4">Color Tokens</h2>
      <div className="grid grid-cols-4 gap-4">
        {colors.map((c) => (
          <div key={c.name} className="flex flex-col gap-2">
            <div
              className="w-full h-16 rounded-lg border border-[#3A3A3A]"
              style={{ backgroundColor: c.hex }}
            />
            <p className="text-white text-sm font-semibold">{c.name}</p>
            <p className="text-[#9B9B9B] text-xs">{c.hex}</p>
            <p className="text-[#9B9B9B] text-xs font-mono">{c.var}</p>
          </div>
        ))}
      </div>
      <h2 className="text-white text-xl font-bold mt-8 mb-4">Typography</h2>
      <div className="flex flex-col gap-3">
        {[
          { label: "Heading 1", className: "text-3xl font-bold text-white" },
          { label: "Heading 2", className: "text-2xl font-bold text-white" },
          { label: "Heading 3", className: "text-xl font-semibold text-white" },
          { label: "Body", className: "text-base text-white" },
          { label: "Caption", className: "text-sm text-[#9B9B9B]" },
        ].map((t) => (
          <div key={t.label} className="flex items-center gap-4">
            <span className="text-[#9B9B9B] text-xs w-24">{t.label}</span>
            <span className={t.className}>EMBER 업계 TOP 스타트업 플랫폼</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const meta: Meta = {
  title: "Design System/Tokens",
  component: ColorPalette,
};
export default meta;

export const Tokens: StoryObj = {};
```

---

## Task 5: Header 컴포넌트 + 스토리

**Files:**
- Create: `components/ui/header.tsx`
- Create: `stories/header.stories.tsx`

- [ ] **Step 1: `components/ui/header.tsx` 작성**

```tsx
import Image from "next/image";

interface HeaderProps {
  title?: string;
  onProfileClick?: () => void;
}

export function Header({ title = "EMBER", onProfileClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-[#1C1C1E]">
      <div className="flex items-center gap-2">
        <Image
          src="/ember-flame.svg"
          alt="EMBER flame"
          width={22}
          height={32}
          priority
        />
        <span className="text-white text-lg font-bold tracking-wide">
          {title}
        </span>
      </div>
      <button
        onClick={onProfileClick}
        className="w-9 h-9 rounded-full bg-[#2D2D2D] flex items-center justify-center border border-[#3A3A3A] hover:bg-[#3A3A3A] transition-colors"
        aria-label="프로필"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9B9B9B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </button>
    </header>
  );
}
```

- [ ] **Step 2: `stories/header.stories.tsx` 작성**

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Header } from "../components/ui/header";

const meta: Meta<typeof Header> = {
  title: "Components/Header",
  component: Header,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof Header>;

export const Default: Story = {};

export const WithCustomTitle: Story = {
  args: { title: "EMBER" },
};
```

---

## Task 6: Button 스토리

**Files:**
- Create: `stories/button.stories.tsx`
- Modify: `components/ui/button.tsx` (EMBER primary 색상 variant 추가)

- [ ] **Step 1: button.tsx의 기존 variants 확인 후 primary variant를 EMBER coral로 커스터마이징**

`components/ui/button.tsx`에서 `default` variant의 className을 확인하고, 이미 CSS var을 쓰고 있으면 globals.css의 `--primary`가 `#FE6E6E`로 설정되어 있으므로 그대로 사용.

- [ ] **Step 2: `stories/button.stories.tsx` 작성**

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../components/ui/button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "ghost", "destructive"],
    },
    size: { control: "select", options: ["default", "sm", "lg"] },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { children: "테스트하러 가기", variant: "default", size: "default" },
};

export const FullWidth: Story = {
  args: { children: "테스트하러 가기", className: "w-full" },
};

export const Outline: Story = {
  args: { children: "바로가기", variant: "outline" },
};
```

---

## Task 7: Badge 스토리

**Files:**
- Create: `stories/badge.stories.tsx`

- [ ] **Step 1: `stories/badge.stories.tsx` 작성**

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "../components/ui/badge";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: "#해시태그" },
};

export const Multiple: Story = {
  render: () => (
    <div className="flex gap-2 flex-wrap">
      {["#스타트업", "#창업", "#IT", "#서울"].map((tag) => (
        <Badge key={tag}>{tag}</Badge>
      ))}
    </div>
  ),
};
```

---

## Task 8: Card 스토리

**Files:**
- Create: `stories/card.stories.tsx`

- [ ] **Step 1: `stories/card.stories.tsx` 작성**

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
};
export default meta;

type Story = StoryObj<typeof Card>;

export const BusinessCard: Story = {
  render: () => (
    <Card className="bg-[#2D2D2D] border-[#3A3A3A] w-80">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-base">사업 이름</CardTitle>
        <div className="flex gap-1 flex-wrap">
          {["#해시태그", "#해시태그", "#해시태그"].map((t, i) => (
            <Badge key={i}>{t}</Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-[#9B9B9B] text-sm leading-relaxed">
          정책 내용 정책 내용 정책 내용 정책 내용 정책 내용 정책 내용 정책 내용...
        </p>
        <Button className="w-full mt-4">바로가기</Button>
      </CardContent>
    </Card>
  ),
};
```

---

## Task 9: Tabs / Checkbox / Select 스토리

**Files:**
- Create: `stories/tabs.stories.tsx`
- Create: `stories/checkbox.stories.tsx`
- Create: `stories/select.stories.tsx`

- [ ] **Step 1: `stories/tabs.stories.tsx` 작성**

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
};
export default meta;

export const TodoTabs: StoryObj = {
  render: () => (
    <Tabs defaultValue="pending" className="w-64">
      <TabsList className="w-full bg-[#2D2D2D]">
        <TabsTrigger value="pending" className="flex-1 data-[state=active]:bg-[#FE6E6E] data-[state=active]:text-white">
          미완료
        </TabsTrigger>
        <TabsTrigger value="done" className="flex-1 data-[state=active]:bg-[#FE6E6E] data-[state=active]:text-white">
          완료
        </TabsTrigger>
      </TabsList>
      <TabsContent value="pending" className="text-white mt-2">미완료 항목</TabsContent>
      <TabsContent value="done" className="text-white mt-2">완료 항목</TabsContent>
    </Tabs>
  ),
};
```

- [ ] **Step 2: `stories/checkbox.stories.tsx` 작성**

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";

const meta: Meta<typeof Checkbox> = {
  title: "Components/Checkbox",
  component: Checkbox,
};
export default meta;

export const Default: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-3 w-64">
      {["체크리스트 1", "체크리스트 2", "체크리스트 3"].map((label, i) => (
        <div key={i} className="flex items-center gap-3 bg-[#2D2D2D] rounded-lg px-3 py-2">
          <Checkbox id={`cb-${i}`} defaultChecked={i > 0} className="border-[#FE6E6E] data-[state=checked]:bg-[#FE6E6E]" />
          <Label htmlFor={`cb-${i}`} className="text-white text-sm">{label}</Label>
        </div>
      ))}
    </div>
  ),
};
```

- [ ] **Step 3: `stories/select.stories.tsx` 작성**

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

const meta: Meta<typeof Select> = {
  title: "Components/Select",
  component: Select,
};
export default meta;

export const RegionSelect: StoryObj = {
  render: () => (
    <Select>
      <SelectTrigger className="w-64 bg-[#2D2D2D] border-[#3A3A3A] text-white">
        <SelectValue placeholder="지역을 선택하세요" />
      </SelectTrigger>
      <SelectContent className="bg-[#2D2D2D] border-[#3A3A3A]">
        {["서울", "경기", "인천", "부산", "광주"].map((region) => (
          <SelectItem
            key={region}
            value={region}
            className="text-white focus:bg-[#FE6E6E] focus:text-white data-[state=checked]:text-[#FE6E6E]"
          >
            {region}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};
```

- [ ] **Step 4: Label 컴포넌트 설치 (Checkbox에 필요)**

```bash
npx shadcn@latest add label
```

---

## Task 10: 최종 확인

- [ ] **Step 1: Storybook 빌드 에러 없는지 확인**

```bash
npm run build-storybook
```

Expected: `storybook-static/` 폴더 생성, 에러 없음

- [ ] **Step 2: 메모리 저장**

디자인 시스템 토큰을 메모리에 저장 (주 색상 `#FE6E6E`, 폰트 Pretendard, 다크 테마).
