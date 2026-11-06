import { useEffect, useRef, useState } from 'react';
import { Flame } from 'lucide-react';
import * as Progress from '@radix-ui/react-progress';
import { CENTURY, centuryState, slotPlan } from '../../utils/century.js';

// "Compacted" is display state only. Totals are the source of truth, so a missing or stale value
// can never change a count; it only decides whether a finished hundred is waiting to be tapped.
const readStored = (key) => {
  try {
    const value = Number.parseInt(window.localStorage.getItem(key), 10);
    return Number.isInteger(value) && value >= 0 ? value : null;
  } catch {
    return null;
  }
};
const writeStored = (key, value) => {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* private mode or full storage: the stack simply re-forms on next load */
  }
};
const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * One bar that always means "this hundred". At 100 the owner taps Compact: the bar folds into a
 * single block in the stack and starts again. Official has a 2,000 goal (20 blocks); training and
 * off-season keep stacking with no target.
 * `canCompact` is false for archived years: everything shows as already stacked, no button.
 * Remount with a new `key` per year/phase so the stored state follows the subject.
 */
export default function CenturyProgress({
  subject,
  streak = 0,
  storageKey,
  canCompact,
  persist,
  loading = false,
}) {
  const { label, total, target, suffix } = subject;
  const rootRef = useRef(null);
  const fillRef = useRef(null);
  const slotRefs = useRef([]);
  const [landing, setLanding] = useState(null);
  // null = not decided yet: follow the totals (everything already stacked) until they are loaded.
  const [stored, setStored] = useState(() =>
    persist && canCompact ? readStored(storageKey) : null
  );

  const blocks = Math.floor(total / CENTURY);
  // While the year's sets are still loading the total is a placeholder, so never settle or clamp on it
  // (an offline reopen must not wipe the saved stack). Undo below a hundred removes the block.
  if (!loading && canCompact) {
    if (stored === null) setStored(blocks);
    else if (stored > blocks) setStored(blocks);
  }
  const state = centuryState({ total, compacted: canCompact ? (stored ?? blocks) : blocks });
  const plan = slotPlan({ blocks: state.blocks, compacted: state.compacted, target });
  const ready = canCompact && state.pending > 0;

  useEffect(() => {
    if (persist && canCompact && !loading && stored !== null) writeStored(storageKey, stored);
  }, [persist, canCompact, loading, storageKey, stored]);

  const compact = () => {
    if (!ready) return;
    const index = state.compacted;
    const slot = slotRefs.current[index];
    const root = rootRef.current;
    const fill = fillRef.current;
    if (slot && root && fill && !prefersReducedMotion() && typeof fill.animate === 'function') {
      const base = root.getBoundingClientRect();
      const place = (box) => ({
        left: `${box.left - base.left}px`,
        top: `${box.top - base.top}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
      });
      const flyer = document.createElement('div');
      flyer.className = 'century-flyer';
      flyer.setAttribute('aria-hidden', 'true');
      root.append(flyer);
      setLanding(index);
      const animation = flyer.animate(
        [
          { ...place(fill.getBoundingClientRect()), borderRadius: '12px' },
          { ...place(slot.getBoundingClientRect()), borderRadius: '5px' },
        ],
        { duration: 420, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'forwards' }
      );
      const done = () => {
        flyer.remove();
        setLanding(null);
      };
      animation.onfinish = done;
      animation.oncancel = done;
    }
    setStored(state.compacted + 1);
  };

  const full = state.barValue >= CENTURY;
  const totalText = target ? ` / ${target.toLocaleString()}` : suffix;
  const countText = plan.goalBlocks
    ? `${state.compacted} of ${plan.goalBlocks} blocks`
    : plural(state.compacted, 'block');
  const barText = full
    ? '100 of 100, ready to compact'
    : `${state.barValue} of 100 push-ups toward the next block`;

  return (
    <div className="summary-official century" ref={rootRef}>
      <div className="summary-official-row">
        <div>
          <p className="summary-label">{label}</p>
          <p className="summary-total" data-testid="progress-total">
            <strong>{total.toLocaleString()}</strong>
            <span className={target ? undefined : 'summary-suffix'}>{totalText}</span>
          </p>
        </div>
        {streak > 0 && (
          <p className="streak">
            <Flame size={16} strokeWidth={2.4} aria-hidden="true" focusable="false" />
            <span>{streak}</span>
            <span className="streak-unit">day streak</span>
          </p>
        )}
      </div>
      <div className="century-barwrap">
        <Progress.Root
          className={full ? 'century-bar is-full' : 'century-bar'}
          aria-label={`${label} progress to the next 100`}
          value={state.barValue}
          max={CENTURY}
          getValueLabel={() => barText}
        >
          <Progress.Indicator
            ref={fillRef}
            className="century-fill"
            style={{ width: `${state.barValue}%` }}
          />
        </Progress.Root>
        <button
          type="button"
          className={ready ? 'century-compact is-ready' : 'century-compact'}
          disabled={!ready}
          onClick={compact}
          aria-label={
            ready
              ? `Compact 100 push-ups into a block${state.pending > 1 ? `, ${state.pending} ready` : ''}`
              : 'Compact'
          }
        >
          <span aria-hidden="true">
            {state.pending > 1 ? `Compact ×${state.pending}` : 'Compact'}
          </span>
        </button>
      </div>
      <div className="century-row">
        <p className="century-caption">
          {ready ? (
            <>
              <b>
                100<span aria-hidden="true"> ✓</span>
                <span className="sr-only"> ready</span>
              </b>
              {state.overflow > 0 && ` · +${state.overflow} toward the next`}
            </>
          ) : (
            <>
              <b>{state.barValue}</b> / 100 · {CENTURY - state.barValue} to the next block
            </>
          )}
        </p>
        <p className="century-count" aria-live="polite">
          {countText}
        </p>
      </div>
      <div
        className="century-stack"
        role="img"
        aria-label={
          plan.goalBlocks
            ? `${state.compacted} of ${plan.goalBlocks} hundreds stacked`
            : `${plural(state.compacted, 'hundred')} stacked`
        }
      >
        <ol className="century-blocks" aria-hidden="true">
          {Array.from({ length: plan.count }, (_, index) => {
            if (plan.hasMore && index === plan.count - 1)
              return (
                <li className="century-more" key={index}>
                  +{plan.hiddenCount}
                </li>
              );
            const className =
              index < state.compacted
                ? 'is-on'
                : index === state.compacted && ready
                  ? 'is-next'
                  : '';
            return (
              <li
                key={index}
                ref={(node) => {
                  slotRefs.current[index] = node;
                }}
                className={landing === index ? `${className} is-landing` : className}
              />
            );
          })}
        </ol>
      </div>
    </div>
  );
}
