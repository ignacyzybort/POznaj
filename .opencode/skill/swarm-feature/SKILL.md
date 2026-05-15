---
name: swarm-feature
description: Build a feature end-to-end: architect plans → coder implements → tester verifies → reviewer gates. Use when user says 'build X feature', 'implement Y', or 'add Z functionality'.
---

# Swarm Feature

Sequential pipeline. Each phase BLOCKS until previous completes:

1. `architect` — design the solution, identify files, plan approach
2. `frontend` or `backend` or `fullstack` (pick best fit) — implement per plan
3. `tester` — verify implementation works, check edge cases
4. `reviewer` — quality gate, report issues for fixing

After all phases, report: what was built, what files changed, any remaining issues.
