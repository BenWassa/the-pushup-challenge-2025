# PushUp visual direction

This records the proposed preview direction for issue #5, not a completed redesign.

## Theme and scene

A participant checks the phone in an ordinary lit room between sets, with one hand free and little patience for navigation. Shipped as a near-black surface (#0a0a0b) with light text, per the Athletic Bold / Brush Impact direction in src/styles/tokens.css.

## Color strategy

Restrained. Red (#e4322c, the brand colour) identifies action, progress and current selection, with neutral surfaces. Tokens live in src/styles/tokens.css. Error and success always have text as well as color.

## Typography

System sans, 16px body, 14px secondary text, 24px screen headings. Numeric totals use tabular figures. No gradient text.

## Layout and components

390px reference width, 20px side insets, simple section separators. Preserve +1/+10/+20/+25 in a two-column grid with 64px minimum height. Keep undo adjacent to confirmed status. Use Log and History as the primary navigation; place Account behind a clear button. Avoid nested cards and decorative glass effects.

## States

Saving is pending, Saved requires acknowledgement, Failed keeps the unsaved set visible with retry, and Offline disables new cloud submissions until an explicit queue contract exists. Archive is read-only. Unknown daily schedule has no fabricated progress denominator.

## Motion

Only short state transitions; respect reduced motion. No celebration before persistence acknowledgement.

## Selected Home heatmap

Owner selected square variant A, refined on 2026-11-06. Show the past 30 days,
including today, oldest first in three rows of ten squares. Use full available
content width, 4px gaps and 3px corners. Title the section “Last 30 days” with a
quiet History button on the same row. Keep the section on the page background:
no raised sheet, contrasting fill, border, shadow, extra padding or edge bleed.
Logging remains the visual focus.

Days with no activity use the same unfilled outline as an empty block in the century stack (token `--cell-empty-ring` in tokens.css), so zero reads as empty, not as a dim fill. Today uses a red outline, never a dot. Omit weekday/date labels, alignment blanks,
legend, selected-day details and the year breakdown from Home. History retains
month names, browsing and day/set details. Preserve keyboard navigation and date
names/counts for assistive technology. January's previous-year activity is read-only
and must not alter current annual totals. Archived views stay year-scoped.

The authoritative decision record is
[issue #33: selected heatmap design](docs/open/033-mobile-home-ui.md#selected-heatmap-design-owner-decisions-2026-11-06).
Earlier heatmap explorations are superseded. Mockups are local and ignored by Git.
This component selection is not approval of the full Home composition or deployment.
