import { Flame } from 'lucide-react';
import * as Progress from '@radix-ui/react-progress';

/**
 * Today's confirmed total and the official cumulative total, clearly separate.
 * `official` is null when the edition has no official challenge to track.
 */
export default function ProgressSummary({ primary, official, streak }) {
  return (
    <section className="summary" aria-label="Progress">
      <div className="summary-today">
        <p className="summary-label">{primary.label}</p>
        <p className="summary-hero" data-testid="primary-total">
          <strong>{primary.value}</strong>
          <span>push-ups</span>
        </p>
        {primary.note && <p className="summary-note">{primary.note}</p>}
      </div>
      {official && (
        <div className="summary-official">
          <div className="summary-official-row">
            <div>
              <p className="summary-label">Official challenge</p>
              <p className="summary-total" data-testid="official-total">
                <strong>{official.value.toLocaleString()}</strong>
                <span> / {official.target.toLocaleString()}</span>
              </p>
            </div>
            {streak > 0 && (
              <p className="streak" aria-label={`${streak}-day streak`}>
                <Flame size={16} strokeWidth={2.4} aria-hidden="true" focusable="false" />
                <span>{streak}</span>
                <span className="streak-unit">day streak</span>
              </p>
            )}
          </div>
          <Progress.Root
            className="progress"
            aria-label="Official challenge progress"
            value={Math.min(official.value, official.target)}
            max={official.target}
            getValueLabel={(value, max) => `${value} of ${max} push-ups`}
          >
            <Progress.Indicator
              className="progress-fill"
              style={{ width: `${Math.min(100, (official.value / official.target) * 100)}%` }}
            />
          </Progress.Root>
        </div>
      )}
    </section>
  );
}
