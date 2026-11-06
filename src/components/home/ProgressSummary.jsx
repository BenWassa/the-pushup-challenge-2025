import CenturyProgress from './CenturyProgress.jsx';

/**
 * Today's confirmed total, then progress in hundreds for the phase being viewed.
 * `century` is null when there is nothing to track (an archived year with no official challenge).
 */
export default function ProgressSummary({ primary, century, streak }) {
  return (
    <section className="summary" aria-label="Progress">
      <div className="summary-today">
        {primary.label && <p className="summary-label">{primary.label}</p>}
        <p className="summary-hero" data-testid="primary-total">
          <strong>{primary.value}</strong>
          <span>push-ups</span>
        </p>
        {primary.note && <p className="summary-note">{primary.note}</p>}
      </div>
      {century && (
        <CenturyProgress
          key={century.storageKey}
          subject={century.subject}
          streak={streak}
          storageKey={century.storageKey}
          canCompact={century.canCompact}
          persist={century.persist}
          loading={century.loading}
        />
      )}
    </section>
  );
}
