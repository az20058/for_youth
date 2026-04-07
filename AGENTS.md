<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Component Reuse Rules

Before implementing any UI feature:

1. **Check `components/ui/` first** — read the available components and reuse them if applicable. Do not recreate what already exists (Button, Card, Badge, Select, Input, etc.).

2. **Reuse page-local components** — when working within a page under `app/`, check all components under that page's directory (e.g. `app/quiz/_components/`, `app/(tabs)/applications/_components/`) and reuse any that fit, rather than writing duplicate markup.

# Post-Implementation Checklist

After writing any code, follow these steps in order:

1. **Lint & format** — fix any prettier or lint rule violations before finishing.
2. **Type errors** — resolve all type errors (red underlines / TS diagnostics) in modified files.
3. **Code review** — review the written code yourself. If you find potential performance issues or bugs, report them to the user and get approval before fixing.

# Testing Rules

When given a feature implementation task:

1. **Write unit tests first** — write utils-based unit tests before implementing the feature.
2. **Run tests after implementation** — run the full test suite when done.
   - Pass: say nothing.
   - Fail: report the failure and fix it.
