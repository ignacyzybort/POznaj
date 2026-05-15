---
name: swarm-fix
description: Debug and fix a bug: debugger finds root cause → coder fixes → tester verifies → reviewer checks. Use when user says 'fix X bug', 'debug Y issue', or 'something is broken'.
---

# Swarm Fix

Sequential debug-then-fix pipeline:

1. Explore the codebase to understand the bug's context
2. `tester` — verify the bug can be reproduced (describe what's wrong)
3. `frontend` or `backend` (pick domain expert) — implement the fix
4. `tester` — verify fix works, check no regression
5. `reviewer` — verify fix is clean and doesn't introduce new issues
