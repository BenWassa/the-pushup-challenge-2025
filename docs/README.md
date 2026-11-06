# PushUp 2027 project documentation

This directory is the **source for product decisions and issue working files**, not a generated Vite build destination.

## Read first
- [Vision](vision.md): problem, product principles, user, success conditions.
- [Strategy](strategy.md): MVP scope, roadmap, decisions and risks.
- [Architecture baseline](architecture.md): observed current code and technical constraints.
- [Open issues](open/): active issue-specific work records, named `NNN-slug.md`.
- [Closed issues](closed/): verified completed issue records. Keep history.

GitHub issues track status, ownership and coordination; Markdown records hold durable analysis and acceptance checks. Link the issue and its Markdown record in both directions. Do not create a document for a trivial issue unless detailed context is useful.

## Directory transition
Legacy deployed static build assets currently also exist under `docs/`. That is temporary and **must not be deleted before deployment source cutover**. Vite output is now configured for `dist/` on the planning branch; GitHub Pages will need to use GitHub Actions before the old static assets are safely removed. See [issue #2](https://github.com/BenWassa/the-pushup-challenge-2025/issues/2).

## Issue workflow
1. Create or update a GitHub issue with scope, constraints and acceptance checks.
2. Add/update `docs/open/NNN-topic.md` where design detail is needed.
3. Implement on a focused branch; open a PR and reference the issue.
4. Verify all acceptance criteria and deployment/data implications.
5. Move the Markdown record to `docs/closed/` upon completion; include PR and verification links.

Do not treat an opened PR as finished work.
