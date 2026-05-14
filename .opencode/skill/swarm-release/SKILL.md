---
name: swarm-release
description: Prepare for release: run tests, update docs, generate changelog, check deployment readiness. Use when user says 'release', 'ship', 'deploy', or 'prepare release'.
---

# Swarm Release

Sequential release pipeline:

1. Run all 6 workers (typecheck, lintfix, buildguard, deadscan, audit, testgaps)
2. `tester` — run full test suite, verify everything passes
3. `docs` — update CHANGELOG.md if it exists, or generate release notes
4. `devops` — verify env vars, build succeeds, Vercel config correct
5. Report: ready to merge to main and deploy, OR list blocking issues
