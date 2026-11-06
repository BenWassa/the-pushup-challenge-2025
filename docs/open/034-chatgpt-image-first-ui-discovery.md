# Issue #34 — ChatGPT image-first UI discovery

- Issue: https://github.com/BenWassa/the-pushup-challenge-2025/issues/34
- Implementation gate: https://github.com/BenWassa/the-pushup-challenge-2025/issues/33
- Status: **In exploration — no design approved**
- Owner: product owner approves each screen in ChatGPT
- Medium: ChatGPT-generated high-fidelity *still* mockups, screen by screen; no coded prototypes as initial deliverables.

## Why

The present UI needs a cohesive redesign. Rather than commission three full applications in parallel, compare visual directions cheaply as individual screen images. The approval system deliberately separates subjective visual choice from later accessibility and functional validation.

## Product contract from current source

Reference `src/App.jsx`, `src/components/app/{ActivityList,History,Account}.jsx`, app styles, `docs/vision.md`, and `docs/strategy.md`. Present visual design must preserve:
- Private solo-first personal challenge journal, installed on phone.
- Training / official / off-season states and year-scoped archived history.
- Fast set logging (+1 / +10 / +20 / +25), with clear confirmed/saving/error and undo.
- Today's confirmed total, progress, history and personal account functions.
- Organizer daily target remains pending if not confirmed; 2027 official total is 2,000 reps.
- No real Firebase or personal records in demos. Use fictional records and a no-write mode.

## Screen 1: HOME / TODAY — design contract

**Fictional test case**: Wednesday, Feb 10, 2027; official challenge; 60 confirmed today; 445 of 2,000 cumulative official; example latest set = 20. Do **not** portray 60 as the official daily target. No invented streaks, motivational scoring, 100,000-rep goals, social feeds or badge systems.

Visual hierarchy:
1. Compact PUSHUP 2027 mark / recognizable identity and date / phase.
2. Dominant today's count: **60 push-ups** (confirmed).
3. Four distinct large +1, +10, +20, +25 logging targets, reachable with one hand.
4. Undo last set and small but legible current save state; error/retry alternatives later.
5. Clearly labeled official progress: **445 / 2,000**; optionally numeric percentage, never graphic-only.
6. Obvious navigation to Home, History, Account.
7. Last sets and ancillary statistics below fold; account/year controls secondary.

### Three starting directions

- **A Athletic editorial**: mostly black and cream with one confident accent, restrained brush treatment, strong compositional typography; not a large unrelated sports photograph.
- **B Performance instrument**: graphite/dark neutral with a high-contrast accent and a rigorous numeric grid; focus on speed and visual clarity, not dense analytics.
- **C Contemporary utility**: bright, clear, energetic and tactile; striking count and controls with understated cards; not gamification.

Make three **individual** full-width high-resolution portrait mockups, each approximately 390×844 logical viewport. No phone frames, presentation slides, GitHub issue sidebars, moodboards, 3-up composites, marketing copy or imaginary features. Use the same fictitious numbers/copy for direct comparison. Generate each option with an explicit direction; inspect text and discard outputs that do not comply.

### Initial review rubric (score each 1–5 plus qualitative notes)

| Dimension | Review focus |
|---|---|
| Immediate comprehension | Date, phase, today's count, official progress |
| Logging speed | +1/+10/+20/+25 visibility and thumb reach |
| Information hierarchy | One dominant task; supporting data subordinated |
| Readability | Numbers, labels, spacing, text length |
| Navigation | Home/History/Account consistency and visibility |
| Brand distinction | Not a generic fitness dashboard |
| Feasibility | React/CSS implementation, responsive behavior |
| Accessibility risks | Contrast, tap size, color reliance, imagery interference |

Treat text artifacts in image generation as errors, not approvals. Do not claim a static design passes WCAG; validate after implementation.

## Iteration and selection

1. Compare three genuinely different Home structures, not just palettes.
2. Record one or two promising directions and target structural revisions.
3. Obtain owner approval of **one Home design**, with exact hierarchy, decisions, selected image reference and any hybridizations.
4. Expand that language screen by screen to History/calendar, set correction & undo, Account/year selection, sign-in, saving/offline/error/archive and splash/loading.
5. Only after selection, hand off to #33 for HTML/CSS, component contracts, tests, mobile/keyboard QA and controlled deployment.

## Decision register

| Screen | Round | Candidates | Chosen | Status | Design reference | Open questions |
|---|---|---|---|---|---|---|
| Home | 1 | A / B / C | — | Pending; initial board outputs do not meet the screen contract | ChatGPT conversation (attach selected export when approved) | Brand, hierarchy, tap layout |
| History | — | — | — | Not started | — | — |
| Corrections | — | — | — | Not started | — | — |
| Account | — | — | — | Not started | — | — |
| Sign-in/states | — | — | — | Not started | — | — |

## Acceptance

- Each approved screen has design reference, rationale, exact text/data, interactions and unresolved states.
- Initial Home exploration contains 3 specification-compliant *standalone* image alternatives.
- Implementation is blocked pending owner choice. No release changes, data migrations or cloud-rule updates.
- #33 is the sole implementation owner; #5 remains the functional mobile UX reference.


## Home feedback — round 2 (Nov 6, 2026)

Owner direction (visual exploration, not final screen approval):
- **Preferred style:** concept A, **Brush Impact**, using the black / white / red brush typography and graphic system.
- **Reduce the hero significantly.** The large showcase image wastes valuable first-screen vertical space. Use a short, punchy graphic/wordmark banner near the top (roughly 80–120px total including identity, not a photographic half-screen hero).
- **No bottom navigation bar.** The app is a unified, vertically scrollable Home experience. Put the functionality directly into successive on-page sections in importance order instead of relying on bottom tabs.
- **Proposed section order:** 1) Today + +1/+10/+20/+25 logging, 2) pending/saved state and Undo, 3) official challenge progress, 4) Recent sets, 5) history/calendar preview, 6) account/preferences/year archive and secondary options. More advanced details can be below fold.
- Preserve the fictional Home data contract: 60 confirmed today, 445/2,000 official, Feb 10 2027, last set 20; do not invent streaks, targets or unrelated features.
- Request next **one focused, standalone Home-screen mockup** on this selected direction; subsequent revisions should compare meaningful layout choices, not change all features at once.

**Implementation implications:** The prior #33 assumption of bottom-tab navigation is superseded by this design preference; assess accessible headings, anchor/section navigation if needed, scroll behavior, safe-area/one-handed reach, and route/state design before implementation. No production code change approved.


## Home design round 3 — owner selection feedback (Nov 6, 2026)

Owner preferences:
- Keep **Brush Impact** in restrained black, white and red.
- Use the **first heatmap treatment from the three minimal Home alternatives**, rather than the miniature long-range/weekday-row variant. Heatmap is an actual Home section, not a navigation tile.
- Make +1 / +10 / +20 / +25 **substantially larger in a 2-by-2 quadrant arrangement**, as previously agreed. These are the sole primary log actions; no separate "Log Push-Ups" CTA.
- **Retain an oversized numerical total counter with a clear progress bar**, and a small streak indicator where a percentage previously appeared. Do not display a calculated percentage; the graphic communicates progress.
- Keep the compact brush header, one vertical Home page, no bottom navigation, with real content sections ordered by importance.
- Continue using credible demo numbers: today 60 confirmed and **445 / 2,000 official challenge**, not the image generator's repeated incorrect 12,340 / 100,000. Do not treat image-generated totals as specification.
- Daily goal remains undecided and should not be invented.

The latest generated image is **not approved**: despite matching the 2×2 button geometry, it still used invented 12,340/100,000 and a mismatched month. Preserve the valid geometry/layout only. Next mockup should correct the figures/date and revisit the owner's chosen first heatmap.
