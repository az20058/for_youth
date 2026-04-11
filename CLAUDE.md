# Claude 규칙 인덱스

상황에 따라 아래 파일을 읽고 규칙을 적용한다. 각 파일은 필요한 시점에만 읽는다.

---

## 언제 무엇을 읽을까

| 상황 | 읽을 파일 |
|------|-----------|
| Next.js 코드 작성 전 (라우팅, API, 미들웨어 등) | `docs/claude/nextjs.md` |
| UI 컴포넌트 구현 또는 수정 시 | `docs/claude/components.md` |
| `useEffect`, `useState`, 커스텀 훅 작성 시 | `docs/claude/hooks.md` |
| 상태 관리 설계 또는 props 전달 구조 결정 시 | `docs/claude/state.md` |
| 코드 작성을 마친 직후 | `docs/claude/checklist.md` |
| 기능 구현 작업을 받았을 때 | `docs/claude/testing.md` |
| 커밋/푸시 작업 시 | `docs/claude/git.md` |

---

## 규칙 파일 목록

- [`docs/claude/nextjs.md`](docs/claude/nextjs.md) — Next.js 버전 주의사항
- [`docs/claude/components.md`](docs/claude/components.md) — 컴포넌트 재사용 규칙
- [`docs/claude/hooks.md`](docs/claude/hooks.md) — Hook 사용 규칙 (useEffect 등)
- [`docs/claude/state.md`](docs/claude/state.md) — 상태 관리 규칙 (zustand, props drilling)
- [`docs/claude/checklist.md`](docs/claude/checklist.md) — 구현 후 체크리스트 (lint, tsc, 코드리뷰)
- [`docs/claude/testing.md`](docs/claude/testing.md) — 테스트 규칙 (TDD, 테스트 실행)
- [`docs/claude/git.md`](docs/claude/git.md) — Git 워크플로우 (커밋/푸시 규칙)
