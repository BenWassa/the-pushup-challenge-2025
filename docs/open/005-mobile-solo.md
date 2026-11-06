# #5 — Solo-first mobile logging UX

**Issue:** https://github.com/BenWassa/the-pushup-challenge-2025/issues/5  
**Status:** Planned — design before implementation  
**Depends on:** #3 data model, #4 season engine

## Product brief
One participant first. Make logging a set fast and clearly saved. Keep the ability to turn on a small private leaderboard later without surfacing empty group content now.

## Design scope
- 390px mockups and acceptance review for dashboard, add/undo, calendar, historical edition, and account settings.
- Preserve existing +1/+10/+20/+25 touch targets as starting interaction.
- Distinguish today, daily target, official cumulative target, training status, rest day and archival year.
- Feedback: saving, confirmed, failed and offline/queued semantics.
- Remove unnecessary username re-entry for personal authenticated account after verifying security design.
- Avoid non-essential animations, auto-zoom blocking, and cramped phone controls.

## Acceptance
- Main actions work at 320, 390 and 430px; 200% text and keyboard navigation remain usable.
- Reload and network issues never show falsely confirmed totals.
- Past years are viewable but cannot accidentally receive new logs.
- Real-device PWA behaviour reviewed in #6.

## Not now
Public group registration, notification journeys, social sharing and elaborate gamification.

## First review batch

Status: preview and small accessibility fixes implemented; full UX acceptance remains open.

390px design proposals use fictional data, not production records:

- [Dashboard](../previews/dashboard-390.png), [editable SVG](../previews/dashboard-390.svg): date/year/phase, pending daily target, confirmed total, four quick-add buttons, adjacent undo and recent sets.
- [History](../previews/history-390.png), [editable SVG](../previews/history-390.svg): edition/month selection, daily detail, explicit read-only archives.
- [Save/account states](../previews/save-states-390.png), [editable SVG](../previews/save-states-390.svg): pending versus confirmed, retained failed set with retry, offline explanation and identity access.

These are wireframe proposals for review, not screenshots of implemented features. PRODUCT.md derives context from the approved vision/strategy; DESIGN.md records proposed restrained orange styling. No large UI rewrite has occurred.

### Source audit findings

- DashboardHero currently uses large decorative progress treatment, while hardcoded target/phase logic belongs to #4 integration.
- DashboardView preserves +1/+10/+20/+25, but the current tall hero and 128px buttons can push logging below the first screen.
- Rank is primary navigation even for one participant. Proposed navigation is Log and History, retaining group capability behind a future explicit setting.
- Calendar only renders the current month. Historical year/month controls depend on #3/#4 read models.
- Calendar cells used simulated buttons with no accessible date name; Space activation could scroll. Replaced with native buttons and full date/reps labels.
- Viewport metadata and global touch listeners blocked pinch zoom. Removed those restrictions; service-worker registration is untouched.
- Button styles still remove focus outlines; calendar cells can be smaller than preferred touch targets. Address consistently in the UI integration pass, with 320px/200% text checks rather than blanket minimum widths that overflow seven columns.

### Save contract required before UI integration

Confirmed totals come from acknowledged records only. Pending amount remains separate until acknowledgement. Retry must reuse a stable record ID (#3) to prevent duplicate submissions. Disable additional writes while a non-idempotent request is pending. Never label a timed-out request as definitively failed without reconciliation. Offline logging remains disabled unless a durable queue is explicitly implemented. Announce saving/confirmed messages through a polite live region and failure through an accessible error message; retain focus on the triggering control.

### Validation and next acceptance

Rendered all three SVGs to 390×844 PNG with rsvg-convert and visually inspected for clipping/overlap. Lint, existing unit tests and production build passed. Native button semantics fix Enter/Space behavior without custom keyboard handling. Browser pinch zoom and actual screen-reader behavior still require real-device verification under #6. No claim is made that the full app passes 320/390/430px or 200% text acceptance. Major dashboard/history changes wait for preview review and safe data/season integration. Existing deployment output in docs/ is preserved.

## Functional UI integration batch

The actual application now uses the annual read model and UID-scoped activity hook instead of the legacy lifetime-counter/profile and leaderboard hooks. The new shell implements quick-add, confirmed progress, latest-set undo, inline correction/removal confirmation, month/day history, read-only year selection, training-goal/timezone preferences, existing-account sign-in/out, and guarded service-worker updates. Imported records are read-only. No public registration or username-based profile selection is present.

Save status comes from the persistence hook; failed operations retain their stable retry operation and confirmed totals remain separate. Cloud writes stay gated pending release approval. The demo uses the isolated in-memory v2 repository and clearly states reset behavior. Client feature flags are rollout controls, never authorization enforcement.

Validation before PR: lint, 24 baseline tests and build passed with the pending data/annual hook source dependencies. Playwright browser smoke exercised demo add +20, correction to15, latest-set undo, calendar, preferences and future2027 read-only view. Visually inspected actual390px dashboard and history. All24 overflow checks passed across Log/History/Account ×320/390/430/1280px ×100%/200% root text size; a discovered enlarged-text nav overflow was fixed with wrapping. Root integration suite provides repeatable journey verification. Physical phone/PWA and production ownership/migration approval remain external release gates, not claimed complete by this UI batch.
