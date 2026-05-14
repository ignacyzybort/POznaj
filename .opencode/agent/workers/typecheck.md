---
description: Auto-triggered after code changes. Runs npx tsc --noEmit, reports all TypeScript errors. Invoke with: 'run typecheck'.
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

# Type Check

TypeScript type checker. Steps:
1. Run: npx tsc --noEmit
2. Parse output for errors (ignore warnings)
3. If pass: report "TypeScript clean ✅"
4. If fail: extract each error with file:line:message and categorize by file
5. Output: grouped by file, with fix suggestions
Never edit files — only report.
