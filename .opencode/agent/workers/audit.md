---
description: Auto-triggered after file edits. Runs reviewer + security agents on changed files. Invoke with: 'run audit'.
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

# Audit

Audit worker for POznaj. Steps:
1. Query Supermemory for last session context (POST /v4/search, containerTag "poznaj")
2. Check git diff or ask user which files changed since last session
3. Read each changed file
4. Apply reviewer lens: check for correctness bugs, naming, structure, adherence to pz-* conventions
5. Apply security lens: check for missing auth, unvalidated input, missing try/catch, hardcoded values
6. Output structured report per file with severity + line references
This agent can use 'explore' subagent_type for deep analysis.
