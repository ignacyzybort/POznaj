---
name: swarm-audit
description: Full security audit: dispatches 6 security-focused agents in parallel. Use when user says 'security audit', 'audit everything', 'scan for vulnerabilities'.
---

# Swarm Audit

Launch 6 agents simultaneously for complete security coverage:

1. `security` — OWASP, injection, auth bypasses
2. `secrets` — hardcoded keys, .env leaks, git history
3. `deps` — package vulnerabilities, outdated deps
4. `deadcode` — unused imports, dead files
5. `perf` — N+1 queries, bundle bloat, slow rendering
6. `a11y` — accessible security considerations

Collect all findings into one security report ordered by risk level.
