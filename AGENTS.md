# Agent working agreement — PushUp

Read `README.md`, `docs/README.md`, `docs/vision.md`, `docs/strategy.md`, and the relevant issue document before editing.

## Working model
- One GitHub issue per bounded workstream. The issue is the status/coordination record; `docs/open/NNN-slug.md` holds research, decisions, implementation notes and acceptance tests.
- For substantial work use a focused branch and PR linked to the GitHub issue. Keep changes in the assigned lane; do not merge your own PR unless explicitly asked.
- Update the issue document as you learn; on verified completion, move it to `docs/closed/` in the closing PR and link the merged PR and verification evidence.
- Before implementation, agree on uncertain product requirements in `docs/strategy.md` or the issue document. Avoid inventing official daily targets.

## Safety boundaries
- Historical Firebase data is irreplaceable. Do not mutate production data, change Firestore rules, reset storage, or migrate profiles without an approved backup, dry-run plan, explicit ownership model and rollback procedure.
- Do not enable a public signup or expose participant records while solo-first access is the requirement.
- Do not modify or retire the existing Pages output in `docs/` before the GitHub Pages source is switched to Actions and the replacement deployment is verified.
- `dist/` is generated output; the Vite build must never delete or overwrite `docs/`.
- Preserve existing demo isolation and the current production site until replacement is confirmed.

## Definition of done
- Scope and acceptance criteria match the issue and its Markdown record.
- Run `npm run lint`, `npm test`, and `npm run build`; report failures honestly. Add deterministic tests for altered business logic.
- Verify date boundaries, history separation, mobile accessibility and save failure states as relevant.
- Explain tested behavior, risks, manual steps and rollback in the PR.
- No unexplained data migrations or unrelated changes.

## Product decisions
- 2027 launch is solo-first, group-ready; Firebase persistence is retained provisionally pending security review.
- The Canadian 2027 challenge is February 3–26 with 2,000 total reps. Organizer daily schedule is not yet verified.
- Training, official challenge and out-of-season activity are distinct.
- The repository name contains 2025 for historical reasons; do not rename it without a deployment/data/PWA migration plan.
