# #4 — Configurable challenge seasons

**Issue:** https://github.com/BenWassa/the-pushup-challenge-2025/issues/4  
**Status:** Planned — design can proceed in parallel with #3  
**Depends on:** #2 foundation; #3 data contract for integration

## Verified 2027 assumptions
- The Push-Up Challenge Canada: 3–26 February 2027, cumulative target 2,000.
- Official daily schedule, daily facts and rest days not yet established in the project; obtain organizer evidence before populating.
- Source: https://www.thepushupchallenge.ca/ and https://www.thepushupchallenge.ca/how-it-works

## Design tasks
- Single configuration object for each edition: ID/year, timezone, official start/end, training window, total goal and per-day schedule state.
- Phase resolution: TRAINING / OFFICIAL / OFF_SEASON; historical reporting should not depend on *today's* phase.
- Separate an optional personal pacing estimate from organizer-confirmed daily goals.
- Local day canonicalization; boundary tests across midnight, January/February, leap years, DST, and future year.
- Read-only selection of past editions and accurate calendar filters.

## Acceptance
- 2027 official dates display correctly and no 2026-specific dates are coded in logic.
- Out-of-season reps never affect official totals.
- Unknown daily targets visibly say pending rather than show fabricated goals.
- Year rollover preserves previous totals.
- Deterministic automated unit tests cover date and goal logic.

## Out of scope
Organizer API integration, extra exercise type conversion, personalized coaching.
