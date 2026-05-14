---
name: goal
description: Plain-English goals → executable agent plans. Decompose a natural language goal into sub-tasks and dispatch specialized agents. Use when user describes an outcome they want ('add infinite scroll', 'redesign profile page', 'fix all API error handling') without specifying implementation details.
---

# Goal

Goal decomposition engine for POznaj.

1. Analyze the goal — identify which parts of the stack are affected (frontend pages, API routes, database, design system, map, scrapers)
2. Decompose into discrete sub-tasks with clear file targets
3. Assign each sub-task to the best-fit agent (use agent descriptions to match)
4. Determine dependency order — which tasks can run in parallel vs sequential
5. Dispatch using task tool — send parallel tasks simultaneously, sequential ones in order
6. Collect all results, verify integration
7. Run workers (typecheck, lintfix, buildguard) to verify
8. Report: what was done, what files changed, verification status

Agent assignment guide: frontend pages → frontend agent. API routes → backend. Prisma/schema → prisma. Styling/visual → css + ui-designer. Security → security. Map → map agent. Data → data agent.
