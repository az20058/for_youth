<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Component Reuse Rules

Before implementing any UI feature:

1. **Check `components/ui/` first** — read the available components and reuse them if applicable. Do not recreate what already exists (Button, Card, Badge, Select, Input, etc.).

2. **Reuse page-local components** — when working within a page under `app/`, check all components under that page's directory (e.g. `app/quiz/_components/`, `app/(tabs)/applications/_components/`) and reuse any that fit, rather than writing duplicate markup.

3. **Componentize shared UI** — if a piece of UI is likely to be reused across pages, extract it into a component in `components/ui/` (global) or the relevant page's `_components/` (local). Do not leave repeated markup inline.

4. **Loading states** — whenever there is a data fetching operation (API call, `useQuery`, server action, etc.), always show a loading state using `<FlameLoading />` (`components/ui/flame-loading.tsx`). Use `fullscreen` prop for full-page loading screens, and the default (inline) variant for partial loading within a layout.

# Hook Usage Rules

- **`useEffect` must be a last resort** — before reaching for `useEffect`, consider whether the same goal can be achieved with derived state, event handlers, or server-side data fetching. Only use `useEffect` when synchronizing with a genuinely external system (DOM APIs, browser-only globals like `localStorage`, third-party subscriptions). When `useEffect` + `setState` is unavoidable (e.g. reading `localStorage` on mount for SSR safety), add `// eslint-disable-next-line react-hooks/set-state-in-effect` with a comment explaining why.

# Post-Implementation Checklist

After writing any code, follow these steps in order:

1. **Lint & format** — run `npx eslint <modified files>` and fix all errors. For warnings from external libraries (e.g. TanStack Table), leave them but note them.
2. **Type errors** — run `npx tsc --noEmit` and resolve all type errors in modified files.
3. **Inline diagnostics** — verify there are no remaining red-underline errors in the modified files. When suppressing a lint rule with `eslint-disable`, place the comment on the exact line that triggers the error (not the surrounding block), and only suppress after confirming the usage is intentional.
4. **Code review** — review the written code yourself. If you find potential performance issues or bugs, report them to the user and get approval before fixing.

# Testing Rules

When given a feature implementation task:

1. **Write unit tests first** — write utils-based unit tests before implementing the feature.
2. **Run tests after implementation** — run the full test suite when done.
   - Pass: say nothing.
   - Fail: report the failure and fix it.
