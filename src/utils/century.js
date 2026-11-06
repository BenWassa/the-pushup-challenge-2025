// Progress in hundreds: the bar is always "this hundred"; each finished hundred is a block.
// Every number here derives from confirmed totals, so Undo can never leave a block behind.
export const CENTURY = 100;
const MAX_SLOTS = 40;

const SUBJECTS = {
  OFFICIAL: { category: 'official', label: 'Official challenge', suffix: '' },
  TRAINING: { category: 'training', label: 'Training', suffix: ' so far' },
  OFF_SEASON: { category: 'offSeason', label: 'Off-season', suffix: ' this year' },
};

/** Which total the progress element is about for a phase. Only the official phase has a target. */
export function progressSubject({ phase, summary, target = null }) {
  const subject = SUBJECTS[phase];
  if (!subject) return null;
  return {
    ...subject,
    total: summary[subject.category] ?? 0,
    target: subject.category === 'official' ? target : null,
  };
}

/** `compacted` is display state (blocks the owner has already tapped into the stack). */
export function centuryState({ total, compacted, unit = CENTURY }) {
  const blocks = Math.floor(Math.max(0, total) / unit);
  const done = Math.min(Math.max(0, compacted), blocks);
  const pending = blocks - done;
  const inBar = total - done * unit;
  return {
    blocks,
    compacted: done,
    pending,
    barValue: Math.min(unit, inBar),
    overflow: Math.max(0, inBar - unit),
  };
}

/** Slot grid under the bar: ghosts up to the official target, else rows of 10 with the next slot shown. */
export function slotPlan({ blocks, compacted, target = null, unit = CENTURY }) {
  const slotsTarget = target ? Math.ceil(target / unit) : null;
  const bounded = slotsTarget !== null && blocks <= slotsTarget;
  const want = bounded ? slotsTarget : Math.max(10, Math.ceil((compacted + 1) / 10) * 10);
  const count = Math.min(want, MAX_SLOTS);
  const hasMore = want > MAX_SLOTS || (!bounded && compacted >= MAX_SLOTS);
  const shown = hasMore ? count - 1 : count;
  return {
    count,
    hasMore,
    hiddenCount: hasMore ? Math.max(0, compacted - shown) : 0,
    goalBlocks: bounded ? slotsTarget : null,
  };
}
