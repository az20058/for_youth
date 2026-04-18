# CLAUDE.md

## 프로젝트

Next.js (App Router) 기반 취업 준비 관리 앱. UI는 shadcn/ui + Tailwind CSS.

## 필수 규칙 (항상 적용)

1. **코드 수정 후 반드시 실행**: `npx eslint <수정 파일>` → `npx tsc --noEmit` → 직접 코드 리뷰 → 문제 발견 시 보고
2. **컴포넌트 중복 금지**: UI 작성 전 `components/ui/`와 해당 페이지 `_components/`를 먼저 확인하고 재사용
3. **커밋/푸시**: lint·tsc·리뷰 통과 후 확인 없이 `git add && git commit && git push origin master` 한 번에 실행

## 상황별 참조 문서

코드 작성 전, 해당되는 문서를 읽고 따른다:

| 해당 조건 | 읽을 파일 |
|-----------|-----------|
| Next.js API·라우팅·미들웨어를 수정할 때 | `docs/claude/nextjs.md` |
| `components/ui/` 파일을 수정하거나 새 컴포넌트를 만들 때 | `docs/claude/components.md` |
| `useEffect`, `useState`, 커스텀 훅을 작성할 때 | `docs/claude/hooks.md` |
| props를 3단계 이상 전달하거나 zustand 스토어를 다룰 때 | `docs/claude/state.md` |
| 새 기능을 구현할 때 (버그 수정 제외) | `docs/claude/testing.md` |
