---
description: Auto-triggered after edits. Runs npm run lint, reports warnings/errors. Invoke with: 'run lintfix'.
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

# Lint Fix

Lint checker and auto-fixer. Steps:
1. Run: npm run lint 2>&1
2. Check for errors vs warnings
3. Report count: X errors, Y warnings
4. List top 10 most frequent error types
5. Note: most remaining errors are pre-existing (require() imports in scrapers). New errors from our changes should be highlighted.
6. Do NOT run --fix automatically — user should decide.
