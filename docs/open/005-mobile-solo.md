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
