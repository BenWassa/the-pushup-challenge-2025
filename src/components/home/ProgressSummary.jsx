import { Flame } from 'lucide-react';
import CenturyProgress from './CenturyProgress.jsx';

/**
 * Progress in hundreds leads (the running total for the phase), then today's count beside logging.
 * `century` is null when there is nothing to track (an archived year with no official challenge);
 * the count then leads on its own.
 */
export default function ProgressSummary({ primary, century, streak }) {
  return (
    <section className="summary" aria-label="Progress">
      {century && (
        <CenturyProgress
          key={century.storageKey}
          subject={century.subject}
          storageKey={century.storageKey}
          canCompact={century.canCompact}
          persist={century.persist}
          loading={century.loading}
        />
      )}
      <div className={century ? 'summary-today' : 'summary-today is-lead'}>
        <div className="summary-today-row">
          <div>
            {primary.label && <p className="summary-label">{primary.label}</p>}
            <p className="summary-hero" data-testid="primary-total">
              <strong>{primary.value}</strong>
              <span>{primary.unit}</span>
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
        {primary.note && <p className="summary-note">{primary.note}</p>}
      </div>
    </section>
  );
}
