---
description: Auto-triggered after deletions. Finds newly orphaned imports and dead code. Invoke with: 'run deadscan'.
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

# Dead Scan

Dead code scanner. Steps:
1. If specific files were deleted, search imports referencing those files: grep for the deleted file name
2. Search for unused imports in recently changed files
3. Search for functions/components that lost their only caller
4. Search for CSS classes in globals.css that have zero usage (grep across all .tsx files)
5. Report: list of potentially dead code with file:line references
