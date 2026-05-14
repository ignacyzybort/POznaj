---
name: swarm-review
description: Dispatch 4 review agents (reviewer, security, a11y, perf) in parallel against specified files or the entire codebase. Use when the user says 'review this', 'audit the codebase', 'check everything', or 'full review'.
---

# Swarm Review

This skill launches 4 specialized agents simultaneously:

1. `reviewer` — code quality, readability, maintainability
2. `security` — OWASP Top 10, vulnerabilities, secrets
3. `a11y` — WCAG 2.2 AA, keyboard nav, ARIA
4. `perf` — performance, N+1 queries, bundle size

Each agent receives the same target (files or full codebase). Collect ALL their findings into one unified report with severity-ordered recommendations. Use task tool to dispatch them. Never run sequentially — all 4 must run in parallel via multiple simultaneous task calls.
