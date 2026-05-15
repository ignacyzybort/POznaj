---
description: Auto-triggered after new feature. Finds new .tsx/.ts files, checks for test coverage, generates stubs if missing. Invoke with: 'run testgaps'.
mode: subagent
model: opencode-zen/deepseek-v4-flash-free
permission:
  edit: deny
  read: allow
  grep: allow
  glob: allow
  bash: allow
  todowrite: allow
---

# Test Gaps

Test gap analyzer. Steps:
1. Check git diff to find new or modified files
2. For each new .tsx or .ts file under src/, check if a corresponding test file exists
3. Test file pattern: src/app/foo/page.tsx → src/app/foo/page.test.tsx or __tests__/page.test.tsx
4. For API routes: src/app/api/events/route.ts → check for test coverage
5. If no test exists, report the gap with suggested test cases
6. If user confirms, generate a basic test stub (describe + it blocks)
