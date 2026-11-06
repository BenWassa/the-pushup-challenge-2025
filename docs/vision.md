# Product vision — PushUp 2027 and beyond

**Status:** Integrated source and automated acceptance candidate; production approval and physical-device verification pending. **Primary participant at launch:** one person.

## One-sentence vision

A reliable, fast, phone-first personal tracker for preparing for and completing the annual Push-Up Challenge, with accurate daily progress and historical records preserved across years.

## Why it exists

The most important interaction is recording a set of push-ups in seconds and knowing that it was saved. Existing tracking and progress features are useful, but hardcoded 2026-era assumptions and non-year-scoped data make the current app unreliable for reuse.

## Primary experience

- Open the installed mobile web app; know immediately whether the day is training, challenge, rest day, or outside the official window.
- Record reps with large, easy-to-tap quick-add options and undo mistakes.
- See today's total, the correct target, cumulative challenge progress, and a calendar/history view.
- Close, reopen or switch devices without losing confirmed records.
- Review earlier challenge years without mixing their totals into the current year.

## Product principles

1. **Solo-first, group-ready.** No unnecessary setup or empty social surfaces for launch; retain extensibility.
2. **Accuracy before visual polish.** Daily and annual totals must be reproducible from records.
3. **Fast, one-handed logging.** The primary action remains available on small phones.
4. **Annual configuration instead of annual rewrites.** Season dates, goals and daily schedule come from one maintained source of truth.
5. **History is permanent.** Old years are visible, not silently reclassified or overwritten.
6. **Clear save state.** No claim of success when a write has failed or is only pending.
7. **Accessible, maintainable web app.** PWA-first but readable, keyboard-accessible and not dependent on complex infrastructure.

## 2027 baseline

- Organizer: The Push-Up Challenge Canada.
- Announced official window: **February 3–26, 2027**.
- Total official challenge target: **2,000 push-ups**.
- Official daily targets and rest days: **not yet configured**; do not infer them from the total or prior year.
- Reference: https://www.thepushupchallenge.ca/
- This is an **independent personal tracker**, not an official submission or fundraising integration. Never imply activity is synced to the organizer.

## Success criteria

- Recording a set normally takes only one or two taps after opening the dashboard.
- Saved reps persist after reload and reauthentication, with explicit handling for failure/offline states.
- 2027 totals are exclusive to 2027's official window and activity phase.
- Training and out-of-season reps remain visible but separate.
- 2025/2026 legacy records remain accessible or safely archived with provenance.
- The app can install and operate appropriately on mobile; future challenge editions require configuration and testing, not a new repository.

## Deliberate non-goals for initial launch

Public user registration, team administration, badges, social feeds, complex challenges, leaderboards for an audience of one, notifications, and integration with the organizer's official app.
